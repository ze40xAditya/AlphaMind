import yfinance as yf
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

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
        ticker = yf.Ticker(symbol)
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
        rank_label=rank_label
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
