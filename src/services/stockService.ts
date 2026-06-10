import api from './api';
import { StockAnalysisResponse, StockDetailsResponse } from '../types/stock';

export const analyzeStock = async (symbol: string): Promise<StockAnalysisResponse> => {
  const response = await api.get<StockAnalysisResponse>(`/stocks/analyze/${symbol}`);
  return response.data;
};

export const getStockDetails = async (symbol: string): Promise<StockDetailsResponse> => {
  const response = await api.get<StockDetailsResponse>(`/stocks/details/${symbol}`);
  return response.data;
};
