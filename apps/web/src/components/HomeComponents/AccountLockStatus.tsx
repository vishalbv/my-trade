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
    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
      <h2 className="text-foreground text-lg">
        Option Trading is Frozen{" - "}
        <span className="text-red-800 dark:text-red-200 text-xl">
          {getStatusText()}
        </span>
      </h2>
      {status && <h3 className="text-foreground mt-2 opacity-90">{status}</h3>}
    </div>
  );
};
