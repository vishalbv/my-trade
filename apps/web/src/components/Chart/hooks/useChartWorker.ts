import { useEffect, useRef } from "react";

export const useChartWorker = () => {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/chartWorker.ts", import.meta.url)
    );

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return workerRef.current;
};
