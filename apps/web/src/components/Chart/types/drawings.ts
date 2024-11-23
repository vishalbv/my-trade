export interface Point {
  x: number;
  y: number;
}

export interface BaseDrawing {
  id: string;
  type: string;
}

export interface TrendLine extends BaseDrawing {
  type: "trendLine";
  startPoint: Point;
  endPoint: Point;
}

export type Drawing = TrendLine;

export interface DrawingState {
  drawings: Drawing[];
  activeDrawing: Drawing | null;
  isDrawing: boolean;
  isDragging: boolean;
  dragPoint: "start" | "end" | "line" | null;
  startPoint: Point | null;
}
