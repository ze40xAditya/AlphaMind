from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.stock import StockAnalysisResponse, StockDetailsResponse, CompareResponse
from app.services import stock_service
from app.models.user import User

router = APIRouter()

@router.get("/analyze/{symbol}", response_model=StockAnalysisResponse)
def analyze_stock(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run full Technical & Fundamental analysis on a stock symbol, logging it to search history."""
    try:
        return stock_service.analyze_stock(db, current_user.id, symbol)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.get("/details/{symbol}", response_model=StockDetailsResponse)
def get_stock_details(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """Fetch quick details of a stock symbol without executing a scoring run."""
    try:
        return stock_service.get_stock_details(symbol)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred fetching stock details: {str(e)}"
        )

@router.get("/compare", response_model=CompareResponse)
def compare_stocks(
    symbol1: str,
    symbol2: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compare two stocks by full analysis."""
    try:
        return stock_service.compare_stocks(db, current_user.id, symbol1, symbol2)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during comparison: {str(e)}"
        )
