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
