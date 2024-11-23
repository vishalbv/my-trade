export interface Point {
  x: number;
  y: number;
}

export interface TrendLine {
  id: string;
  type: "trendLine";
  startPoint: Point;
  endPoint: Point;
  selected?: boolean;
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
