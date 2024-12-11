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

interface ExpiryDate {
  date: string;
  expiry: string;
}

interface UpcomingExpiryDates {
  [key: string]: ExpiryDate[];
}

export const findNearbyExpiries = (
  upcomingExpiryDates: UpcomingExpiryDates
) => {
  const now = Date.now();
  const allExpiries: [string, string][] = []; // [date, symbol]

  Object.entries(upcomingExpiryDates).forEach(([symbol, expiries]) => {
    expiries.forEach(({ date, expiry }) => {
      const expiryTimestamp = parseInt(expiry) * 1000;
      if (expiryTimestamp > now) {
        allExpiries.push([date, symbol]);
      }
    });
  });

  // Sort by expiry date
  allExpiries.sort((a, b) => {
    const dateA = new Date(a[0].split("-").reverse().join("-"));
    const dateB = new Date(b[0].split("-").reverse().join("-"));
    return dateA.getTime() - dateB.getTime();
  });

  // Return next 5 expiries
  return allExpiries.slice(0, 5);
};
