import moment from "moment";

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
  const allExpiries: [string, string][] = []; // [date, symbol]

  Object.entries(upcomingExpiryDates).forEach(([symbol, expiries]) => {
    const { date, expiry } = expiries[0];
    if (moment(date, "DD-MM-YYYY").isSameOrAfter(moment().startOf("day"))) {
      allExpiries.push([date, symbol]);
    }
  });

  // Sort by expiry date
  allExpiries.sort((a, b) => {
    const dateA = moment(a[0], "DD-MM-YYYY");
    const dateB = moment(b[0], "DD-MM-YYYY");
    return dateA.diff(dateB, "days");
  });

  // Return next 5 expiries
  return allExpiries;
};
