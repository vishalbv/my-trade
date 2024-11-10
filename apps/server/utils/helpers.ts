import moment from "moment";
import dbService from "../services/db";
import _app from "../states/app/index";

import _fyers from "../states/fyers/index";
import _shoonya from "../states/shoonya/index";
import logger from "../services/logger";
import { _allStates } from "../states/allstates";
import statesDbService from "../services/statesDb";

export const checkLoginSession = async (callback: () => void) => {
  try {
    const appState = await statesDbService.getStateById("app");
    if (appState) {
      const { lastLoginDate, refreshTokenExpiry } = appState;
      if (refreshTokenExpiry) {
        if (moment().isAfter(moment(refreshTokenExpiry))) {
          statesDbService.upsertState("app", {
            refreshTokenExpiry: null,
          });
          logoutAll();
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
  _app.setState({ loggedIn: false });
};
