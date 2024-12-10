import { useEffect, useRef } from "react";

export const useChartOptimizer = () => {
  const frameRef = useRef<number>();
  const lastDrawTime = useRef<number>(0);

  const scheduleUpdate = (callback: () => void) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const now = performance.now();
    const timeSinceLastDraw = now - lastDrawTime.current;

    if (timeSinceLastDraw < 16) {
      // Target 60fps
      frameRef.current = requestAnimationFrame(() => {
        lastDrawTime.current = performance.now();
        callback();
      });
    } else {
      callback();
      lastDrawTime.current = now;
    }
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return scheduleUpdate;
};
