import { useSelector } from "react-redux";
import moment from "moment";

const isDatesEqual = (date: moment.Moment) => {
  return date.format("DD-MM-YYYY") === moment().format("DD-MM-YYYY");
};

export const AccountLockStatus = () => {
  const { accountLockedTill, status } = useSelector(
    (state: any) => state.states.shoonya?.accountLockData || {}
  );

  const getStatusText = () => {
    if (!accountLockedTill) return null;

    const date = moment(accountLockedTill, "DD-MM-YYYY hh:mm a");

    if (isDatesEqual(date) && date.format("hh:mm a") === "11:59 pm") {
      return "For The Day";
    } else if (isDatesEqual(date)) {
      return `till ${date.format("hh:mm a")}`;
    }
    return "For this Month";
  };

  if (
    !accountLockedTill ||
    moment(accountLockedTill, "DD-MM-YYYY hh:mm a").isBefore(moment())
  ) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <h2 className="text-red-900 dark:text-white/80 text-md font-medium">
          Option Trading is Frozen
          <span className="mx-2">•</span>
          <span className="text-red-700 dark:text-red-200 font-semibold">
            {getStatusText()}
          </span>
        </h2>
      </div>
      {status && (
        <p className="text-red-800 dark:text-red-200 text-sm mt-2 ml-5 opacity-90">
          {status}
        </p>
      )}
    </div>
  );
};
