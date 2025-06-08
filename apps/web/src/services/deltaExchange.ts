import axios from "axios";

const BASE_URL = "https://api.india.delta.exchange";

export interface OHLCData {
  close: number;
  high: number;
  low: number;
  open: number;
  time: number;
  timestamp: number;
  volume: number;
  index?: number;
}

export interface OHLCParams {
  symbol: string;
  resolution: string;
  start: number;
  end: number;
}

export const deltaExchangeApi = {
  getOHLCData: async (params: OHLCParams): Promise<OHLCData[]> => {
    try {
      const response = await axios.get(`${BASE_URL}/v2/history/candles`, {
        headers: {
          Accept: "application/json",
        },
        params,
      });

      // Map the response data to match the required format
      return response.data.result
        .reverse()
        .map((candle: any, index: number) => ({
          close: candle.close,
          high: candle.high,
          low: candle.low,
          open: candle.open,
          time: candle.time, // Use time directly from API
          timestamp: candle.time * 1000, // Convert time to milliseconds for timestamp
          volume: candle.volume,
          index: index,
        }));
    } catch (error: any) {
      console.error(
        "Failed to fetch OHLC data:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getMarketPrice: async (symbol: string): Promise<number> => {
    try {
      const response = await axios.get(`${BASE_URL}/v2/tickers`, {
        params: { symbol },
      });
      return response.data.result.last_price;
    } catch (error: any) {
      console.error(
        "Failed to fetch market price:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
