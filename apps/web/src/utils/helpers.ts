export const _setInterval = (
  fn: () => void,
  interval: number,
  testMode = false
) => {
  fn();
  if (testMode) return null;
  return setInterval(() => {
    fn();
  }, interval);
};

export const PRICECOLOR = (val: number | string) =>
  Number(val) >= 0
    ? "text-green-500 dark:text-green-400"
    : "text-destructive dark:text-red-400";
