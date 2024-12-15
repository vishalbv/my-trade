import moment from "moment";

import _shoonya from "./index";
import { _shoonyaSocket } from "./socket";
import notify from "../../services/notification";

interface AccountLockCondition {
  id: string;
  condition: boolean;
  accountLockedTill?: string;
  status: string;
  isClosingRequired: boolean;
  isClearIntervalRequired: boolean;
  isNotifiedMaxLossOfDayByTwo?: boolean;
}

// const isDatesEqual = (date: moment.Moment) => {
//   return date.format("DD-MM-YYYY") === moment().format("DD-MM-YYYY");
// };

export const checkMoneyManagementRules = () => {
  const {
    moneyManage: {
      maxLossOfMonth,
      maxLossOfDay,
      maxLossOfDayInRs,
      maxNoOfTrades,
      securePercentage,
      maxBrokerage,
    },
    accountLockData: { isNotifiedMaxLossOfDayByTwo = false } = {},
    fundInfo: { openBalance = 0, brokerage = 0 } = {},
    noOfTrades,
    maxProfitTillNow,
  } = _shoonya.getState();

  const pl = _shoonyaSocket.getState()._shoonyaPL;
  if (!pl) return; // Skip if PL not available

  const lockToTodayEnd = moment()
    .set({ hours: 23, minutes: 59 })
    .format("DD-MM-YYYY hh:mm a");

  const accountLockConditions: AccountLockCondition[] = [
    {
      id: "maxProfitTillNow",
      condition:
        maxProfitTillNow > 0.5 * openBalance &&
        pl < securePercentage * 0.01 * openBalance,
      accountLockedTill: lockToTodayEnd,
      status: "Closed all positions: Profit fell below secure percentage",
      isClosingRequired: true,
      isClearIntervalRequired: true,
    },
    {
      id: "maxNoOfTrades",
      condition: noOfTrades > maxNoOfTrades,
      accountLockedTill: lockToTodayEnd,
      status: "Closed all positions: Maximum trades limit reached",
      isClosingRequired: true,
      isClearIntervalRequired: true,
    },
    {
      id: "maxLossOfDayInRs",
      condition: pl < -1 * maxLossOfDayInRs,
      accountLockedTill: lockToTodayEnd,
      status: "Closed all positions: Maximum daily loss limit reached",
      isClosingRequired: true,
      isClearIntervalRequired: true,
    },
    {
      id: "maxLossOfDayByTwo_notify_before_2pm",
      condition:
        pl < (-1 * maxLossOfDayInRs) / 2 &&
        !isNotifiedMaxLossOfDayByTwo &&
        moment().hours() < 14,
      accountLockedTill: moment()
        .add(10, "minutes")
        .format("DD-MM-YYYY hh:mm a"),
      status:
        "Warning: Half of max daily loss reached. Account locked for 10 minutes",
      isClosingRequired: true,
      isClearIntervalRequired: false,
      isNotifiedMaxLossOfDayByTwo: true,
    },
    // Add other conditions as needed
  ];

  for (const condition of accountLockConditions) {
    if (condition.condition) {
      notify.info(condition.status);
      _shoonya.setState({
        accountLockData: condition,
        _db: true,
      });

      if (condition.isClosingRequired) {
        _shoonya.closeAll({ type: "positions" });
      }

      if (condition.isClearIntervalRequired) {
        _shoonya.clearIntervalAndUpdate("moneyManageInterval");
      }

      break;
    }
  }
};

export const startMoneyManagementInterval = () => {
  _shoonya.clearIntervalAndUpdate("moneyManageInterval");
  const interval = setInterval(() => {
    if (_shoonya.getState().access_token) {
      checkMoneyManagementRules();
    }
  }, 3000);
  _shoonya.setIntervalAndUpdate("moneyManageInterval", interval);
};
