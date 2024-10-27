import express from "express";

export interface ApiResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export function sendResponse<T>(res: express.Response, data: ApiResponse<T>) {
  res.status(data.status).json(data);
}
