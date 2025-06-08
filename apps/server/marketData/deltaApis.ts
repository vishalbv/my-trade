import { Router } from "express";
import { DeltaService } from "../services/delta.service";

const deltaService = new DeltaService();

export const declareDeltaApis = () => {
  return {
    "GET /delta/balances": async (req: any, res: any) => {
      try {
        const balances = await deltaService.getWalletBalances();
        res.json(balances);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },

    "GET /delta/price/:instrumentId": async (req: any, res: any) => {
      try {
        const price = await deltaService.getMarketPrice(
          Number(req.params.instrumentId)
        );
        res.json({ price });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },

    "GET /delta/ohlc": async (req: any, res: any) => {
      try {
        const { symbol = "BTCUSD", resolution = "5m" } = req.query;
        const data = await deltaService.getOHLCData(
          symbol as string,
          resolution as string
        );
        res.json(data);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },

    "POST /delta/order": async (req: any, res: any) => {
      try {
        const order = await deltaService.placeOrder(req.body);
        res.json(order);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },

    "POST /delta/order/bracket": async (req: any, res: any) => {
      try {
        const order = await deltaService.placeBracketOrder(req.body);
        res.json(order);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },

    "POST /delta/order/market": async (req: any, res: any) => {
      try {
        const { symbol = "BTCUSD", size = 1, side = "buy" } = req.body;
        const order = await deltaService.placeMarketOrder(symbol, size, side);
        res.json(order);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  };
};
