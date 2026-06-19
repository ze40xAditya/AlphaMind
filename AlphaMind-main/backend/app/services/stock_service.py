import requests
import yfinance as yf
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# Setup custom requests session to bypass Yahoo Finance cloud IP blocks and rate limits
yf_session = requests.Session()
yf_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
})

from app.schemas.stock import StockAnalysisResponse, StockDetailsResponse
from app.services import (
    technical_analysis_service,
    fundamental_analysis_service,
    ranking_service,
    history_service,
)

def normalize_symbol(symbol: str) -> str:
    """Normalize the stock symbol. Default to .NS (NSE) if no exchange suffix is present."""
    symbol = symbol.strip().upper()
    if not symbol:
        return ""
    # If there's no dot suffix (e.g. TCS), append .NS for National Stock Exchange of India
    if "." not in symbol:
        return f"{symbol}.NS"
    return symbol

def get_clean_symbol(symbol: str) -> str:
    """Extract symbol prefix without exchange suffix (e.g. TCS.NS -> TCS)."""
    return symbol.split(".")[0]

def fetch_ticker_data(symbol: str):
    """Utility to fetch yfinance ticker with checks."""
    try:
        ticker = yf.Ticker(symbol, session=yf_session)
        return ticker
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Error connecting to data source for {symbol}: {str(e)}"
        )

def analyze_stock(db: Session, user_id: int, raw_symbol: str) -> StockAnalysisResponse:
    """Orchestrate the full technical and fundamental analysis of a stock."""
    symbol = normalize_symbol(raw_symbol)
    if not symbol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock symbol cannot be empty"
        )

    ticker = fetch_ticker_data(symbol)
    
    # 1. Fetch 1-year historical price data
    try:
        hist = ticker.history(period="1y")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to retrieve price history for {symbol}: {str(e)}"
        )
        
    if hist.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No price data found for symbol {symbol}. Please verify the symbol is correct."
        )

    # 2. Fetch fundamental data / info
    try:
        info = ticker.info
        if not info or len(info) <= 5:  # Check if yfinance returned empty/mock dict
            # If info is empty, try to populate basic values
            info = {
                "longName": get_clean_symbol(symbol),
                "sector": "Unknown",
                "currentPrice": float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
            }
    except Exception:
        # Fallback if info fetch fails
        info = {
            "longName": get_clean_symbol(symbol),
            "sector": "Unknown",
            "currentPrice": float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
        }

    # Extract metadata
    company_name = info.get("longName") or info.get("shortName") or get_clean_symbol(symbol)
    sector = info.get("sector") or "Unknown"
    description = info.get("longBusinessSummary") or info.get("description") or info.get("businessSummary")
    current_price = info.get("currentPrice") or info.get("regularMarketPrice")
    if current_price is None and not hist.empty:
        current_price = float(hist["Close"].iloc[-1])

    # 3. Perform Technical Analysis
    tech_analysis = technical_analysis_service.analyze(hist)

    # 4. Perform Fundamental Analysis
    fund_analysis = fundamental_analysis_service.analyze(info)

    # 5. Composite Ranking
    final_score = ranking_service.calculate_final_score(
        tech_analysis.technical_score, fund_analysis.fundamental_score
    )
    recommendation = ranking_service.get_recommendation(final_score)
    rank_label = ranking_service.get_rank_label(final_score)

    # 6. Save Search to History
    history_service.save_search(
        db=db,
        user_id=user_id,
        stock_symbol=raw_symbol.strip().upper(),  # save queried name
        stock_name=company_name,
        technical_score=tech_analysis.technical_score,
        fundamental_score=fund_analysis.fundamental_score,
        final_score=final_score,
        recommendation=recommendation
    )

    return StockAnalysisResponse(
        symbol=raw_symbol.strip().upper(),
        company_name=company_name,
        sector=sector,
        current_price=current_price,
        technical=tech_analysis,
        fundamental=fund_analysis,
        final_score=float(final_score),
        recommendation=recommendation,
        rank_label=rank_label,
        description=description
    )

def get_stock_details(raw_symbol: str) -> StockDetailsResponse:
    """Retrieve quick static stock info and basic market price data."""
    symbol = normalize_symbol(raw_symbol)
    ticker = fetch_ticker_data(symbol)
    
    try:
        info = ticker.info
        if not info or len(info) <= 5:
            raise ValueError()
    except Exception:
        # Fallback if yfinance info fails, get it from history
        try:
            hist = ticker.history(period="5d")
            if hist.empty:
                raise ValueError()
            price = float(hist["Close"].iloc[-1])
            return StockDetailsResponse(
                symbol=raw_symbol.strip().upper(),
                company_name=get_clean_symbol(symbol),
                sector="Unknown",
                industry="Unknown",
                current_price=price,
                market_cap=None,
                pe_ratio=None,
                fifty_two_week_high=None,
                fifty_two_week_low=None
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock symbol {symbol} details could not be found."
            )

    company_name = info.get("longName") or info.get("shortName") or get_clean_symbol(symbol)
    
    return StockDetailsResponse(
        symbol=raw_symbol.strip().upper(),
        company_name=company_name,
        sector=info.get("sector"),
        industry=info.get("industry"),
        current_price=info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice"),
        market_cap=info.get("marketCap"),
        pe_ratio=info.get("trailingPE"),
        fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
        fifty_two_week_low=info.get("fiftyTwoWeekLow")
    )

from app.schemas.stock import CompareResponse
def compare_stocks(db: Session, user_id: int, symbol1: str, symbol2: str) -> CompareResponse:
    """Compare two stocks."""
    stock1_analysis = analyze_stock(db, user_id, symbol1)
    stock2_analysis = analyze_stock(db, user_id, symbol2)
    
    winner = None
    insight = ""
    
    if stock1_analysis.final_score > stock2_analysis.final_score:
        winner = stock1_analysis.symbol
        diff = stock1_analysis.final_score - stock2_analysis.final_score
        insight = f"{stock1_analysis.symbol} is currently stronger than {stock2_analysis.symbol} by {diff:.1f} points."
    elif stock2_analysis.final_score > stock1_analysis.final_score:
        winner = stock2_analysis.symbol
        diff = stock2_analysis.final_score - stock1_analysis.final_score
        insight = f"{stock2_analysis.symbol} is currently stronger than {stock1_analysis.symbol} by {diff:.1f} points."
    else:
        winner = "Tie"
        insight = f"Both {stock1_analysis.symbol} and {stock2_analysis.symbol} share the same final score."

    return CompareResponse(
        stock1=stock1_analysis,
        stock2=stock2_analysis,
        winner=winner,
        insight=insight
    )
