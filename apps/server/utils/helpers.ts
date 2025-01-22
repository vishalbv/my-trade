import moment from "moment";
import dbService from "../services/db";
import _app from "../states/app/index";

import _fyers from "../states/fyers/index";
import _shoonya from "../states/shoonya/index";
import logger from "../services/logger";
import { _allStates } from "../states/allstates";
import statesDbService from "../services/statesDb";
import { updateMarketStatus } from "../states/app/checkMarketStatus";
import _flattrade from "../states/flattrade/index";

const DATE_FORMAT = "DD-MM-YYYY";

export const parseDate = (dateString: string) => {
  return moment(dateString, DATE_FORMAT);
};

export const checkLoginSession = async (callback: () => void) => {
  try {
    const appState = await statesDbService.getStateById("app");

    updateMarketStatus({
      holidays: appState?.holidays,
      setState: (data: any) => _app.setState({ marketStatus: data }),
    });

    if (appState) {
      const { lastLoginDate, refreshTokenExpiry } = appState;
      if (refreshTokenExpiry) {
        if (moment(refreshTokenExpiry, "DD-MM-YYYY").isBefore(moment())) {
          statesDbService.upsertState("app", {
            refreshTokenExpiry: null,
          });
          logoutAll();
        } else {
          _app.setState({
            lastLoginDate: appState?.lastLoginDate,
            refreshTokenExpiry: appState?.refreshTokenExpiry,
            holidays: appState?.holidays,
          });
        }
      }
      if (lastLoginDate && moment().diff(moment(lastLoginDate), "hours") <= 8) {
        callback();
      } else {
        if (!_app.getState().loggingIn) logoutAll();
      }
    }
  } catch (e: any) {
    logger.error(e);
  }
};

export const checkAllLoginStatus = () => {
  const loggedIn =
    _fyers.getAccessToken() && _shoonya.getAccessToken() ? true : false;
  _app.setState({ loggedIn });
};

const startingFunctionsAtLogout = async () => {
  return Promise.all([
    ...Object.values(_allStates).map((i: any) => {
      i.startingFunctionsAtLogout();
    }),
  ]);
};

export const logoutAll = () => {
  logger.info("logging out");
  startingFunctionsAtLogout();
  _fyers.logout();
  _shoonya.logout();
  _flattrade.logout();
  _app.setState({ loggedIn: false });
};
