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
    const { date, expiry } = expiries[0] as any;
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

export const MARKET_START_TIME = [9, 15];
export const MARKET_END_TIME = [15, 30];

export const calculateFromTimestamp = (timeframe: string): number => {
  const [MARKET_START_HOUR, MARKET_START_MINUTE] = MARKET_START_TIME as [
    number,
    number,
  ];
  const now = new Date();

  // Set fixed day ranges based on timeframe
  let daysToGoBack = 0;

  switch (timeframe) {
    case "D":
      daysToGoBack = 365; // For daily, go back 365 days
      break;
    case "15":
      daysToGoBack = 99; // For 15min, go back 99 days
      break;
    case "5":
      daysToGoBack = 30; // For 5min, also 99 days
      break;
    case "1":
      daysToGoBack = 6; // For 1min, also 99 days
      break;
    default:
      daysToGoBack = 99;
  }

  let currentDate = new Date(now);
  currentDate.setDate(currentDate.getDate() - daysToGoBack);

  // For intraday timeframes, set to market opening time
  if (timeframe !== "D") {
    currentDate.setHours(MARKET_START_HOUR, MARKET_START_MINUTE, 0, 0);
  }

  return Math.floor(currentDate.getTime() / 1000);
};
