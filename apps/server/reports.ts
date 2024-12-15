import moment from "moment";
import _shoonya from "./states/shoonya/index";
import dbService from "./services/db";
import _app from "./states/app/index";
import notify from "./services/notification";

export const generateReport = async () => {
  const { fundInfo, moneyManage, accountLockData, positions } =
    _shoonya.getState();
  const { doneForTheDay } = _app.getState();
  await dbService.upsertDocument("reports", moment().format("DD-MM-YYYY"), {
    shoonya: {
      fundInfo,
      moneyManage,
      accountLockData,
      positions,
    },
    app: {
      doneForTheDay,
    },
  });
  notify.info({ description: "Report is generated", speak: true });
};
