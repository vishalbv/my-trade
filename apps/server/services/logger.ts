type LogMethod = (message: string, ...meta: any[]) => void;

const getTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const createLogMethod = (
  consoleMethod: (...args: any[]) => void
): LogMethod => {
  return (message: string, ...meta: any[]) => {
    consoleMethod(`[${getTimestamp()}] ${message}`, ...meta);
  };
};

const logger = {
  info: createLogMethod(console.info),
  error: createLogMethod(console.error),
  warn: createLogMethod(console.warn),
  debug: createLogMethod(console.debug),
};

export default logger;
