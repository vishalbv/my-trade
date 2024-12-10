import { useRef, useCallback } from "react";

export const useOptimizedRenderer = () => {
  const renderQueue = useRef<Set<string>>(new Set());
  const frameRef = useRef<number>();

  const scheduleRender = useCallback(
    (chartId: string, renderFn: () => void) => {
      renderQueue.current.add(chartId);

      if (frameRef.current) {
        return;
      }

      frameRef.current = requestAnimationFrame(() => {
        renderQueue.current.clear();
        frameRef.current = undefined;
        renderFn();
      });

      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = undefined;
        }
        renderQueue.current.delete(chartId);
      };
    },
    []
  );

  return scheduleRender;
};
