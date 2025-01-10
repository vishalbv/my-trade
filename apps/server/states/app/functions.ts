// import moment from "moment";
// import _app from "../app/index.js";

import { getTimeoutTo, isDatesEqual } from "@repo/utils/helpers";
import moment from "moment";
import _app from "./index";
import _shoonya from "../shoonya/index";
// import notify from "../../services/notification";
// import dbService from "../../services/db";

// import {
//   getReportsFromDB,
//   getStatesDBByID,
//   postToReportsDB,
//   postToStatesDB,
//   postToTasksDB,
// } from "../../services/db.js";
// import { logger } from "../../utils/logger.js";
// import _fyers from "../fyers/index.js";
// import _shoonya from "../shoonya/index.js";
// import { getTimeoutTo, isDatesEqual } from "../../utils/helpers.js";

// import { NOTIFY } from "../../services/notify.js";
// // import { _allStates } from "../../server/all-states.js";

// export const checkAllLoginStatus = () => {
//   const loggedIn =
//     _fyers.getAccessToken() && _shoonya.getAccessToken() ? true : false;
//   _app.setState({ loggedIn });
// };

// export const logoutAll = () => {
//   logger("logging out");
//   const startingFunctionsAtLogout = async () => {
//     // return Promise.all([
//     //   ..._allStates.map(async (i) => {
//     //     await i.startingFunctionsAtLogout();
//     //   }),
//     // ]);
//     // fetchGetDB("patterns").then((data) => _app.setState({ patterns: data }));
//   };
//   startingFunctionsAtLogout();

//   _fyers.logout();
//   _shoonya.logout();
// };

// export const checkLoginSession = async (callback) => {
//   try {
//     const { lastLoginDate } = await getStatesDBByID("app");
//     if (lastLoginDate && moment().diff(moment(lastLoginDate), "hours") <= 8) {
//       callback();
//     } else {
//       if (!_app.getState().loggingIn) logoutAll();
//     }
//   } catch (e) {
//     logger(e);
//   }
// };

// export const generateTask = async (task) => {
//   await postToTasksDB(moment().valueOf(), task);
//   // NOTIFY.speak("report is generated");
// };

// export const deleteTask = async (task) => {
//   await postToTasksDB(task.id, {}, true);
//   // NOTIFY.speak("report is generated");
// };
// export const getReports = async () => {
//   return await getReportsFromDB();
// };

export const updateMarketStatus = ({
  holidays,
  setState,
}: {
  holidays: string[];
  setState: any;
}) => {
  let now = moment(moment().format("hh:mm:ss a"), "h:mm:ss a");

  let isHoliday =
    now.days() == 0 ||
    now.days() == 6 ||
    holidays.some(([i]: string) => isDatesEqual(moment(i, "DD-MMM-YYYY")));

  let times = [
    {
      time: "00:00:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 0,
      },
    },
    {
      time: "09:00:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: true,
        status: 1,
      },
    },
    {
      time: "09:08:00 am",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 2,
      },
    },
    {
      time: "09:15:00 am",
      status: {
        isHoliday,
        activeStatus: true,
        preMarketStatus: false,
        status: 3,
      },
    },
    {
      time: "03:30:01 pm",
      status: {
        isHoliday,
        activeStatus: false,
        preMarketStatus: false,
        status: 4,
      },
      callback: () => {
        // generateReport();
      },
    },
  ];
  let index = times.findIndex((i) => now.isBefore(moment(i.time, "h:mm:ss a")));
  if (isHoliday || index == -1)
    return setState({
      isHoliday,
      activeStatus: false,
      preMarketStatus: false,
      status: 0,
    });
  times[index - 1] && setState(times[index - 1].status);

  times.slice(index - 1, times.length).map((i) => {
    setTimeout(
      () => {
        setState(i.status);
        i.callback && i.callback();
      },
      getTimeoutTo(moment(i.time, "h:mm:ss a"))
    );
  });
};
