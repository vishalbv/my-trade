import { fyersAuthParams } from "@repo/utils/cred";
import State from "../state.js";
import { fyersModel } from "fyers-api-v3";

// import { checkAllLoginStatus } from "../app/functions.js";
import { DDMMYYYY, REDIRECT_URL } from "@repo/utils/constants";
// import _ticksFyersService from "../../services/ticks-fyers-service.js";
import logger from "../../services/logger";
import { validateRefreshToken } from "./functions";

import { checkAllLoginStatus } from "../../utils/helpers";
import moment from "moment";
import statesDbService from "../../services/statesDb";
import { startFyersSocket } from "./socket";
import notify from "../../services/notification";

const fyers = new fyersModel();
fyers.setAppId(fyersAuthParams.app_id);
fyers.setRedirectUrl(REDIRECT_URL);

const initialState = { id: "fyers", app_id: fyersAuthParams.app_id };

class Fyers extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
    if (_new.access_token && _old.access_token !== _new.access_token) {
      this.setAccessToken(_new.access_token);
    }
  };

  preLogin = () => {
    try {
      const authCodeURL = fyers.generateAuthCode();
      return { authCodeURL };
    } catch (error: any) {
      throw new Error(`Failed to generate auth code: ${error.message}`);
    }
  };

  setAccessToken = (access_token: string | null) => {
    fyers.setAccessToken(access_token);
    this.setState({ access_token });

    checkAllLoginStatus();

    if (access_token) {
      this.initializeFyers(access_token);
    }
  };

  initializeFyers = (accessToken: string) => {
    try {
      startFyersSocket(accessToken);
    } catch (error) {
      logger.error("Failed to initialize Fyers:", error);
      notify.error("Failed to initialize Fyers connection");
    }
  };

  getAccessToken = () => this.getState().access_token;

  login = async (body: any) => {
    logger.info("logging to fyers", fyersAuthParams, body);

    try {
      let response;
      if (this.getState().refresh_token && false) {
        response = await validateRefreshToken({
          appIdHash: fyersAuthParams.appIdHash,
          refreshToken: this.getState().refresh_token,
          pin: fyersAuthParams.pin,
        });
        if (response.s === "ok") {
          const { access_token } = response;
          await statesDbService.upsertState(this.getState().id, {
            access_token,
          });
        }
      } else {
        response = await fyers.generate_access_token({
          client_id: fyersAuthParams.app_id,
          secret_key: fyersAuthParams.secret_key,
          auth_code: body.auth_code,
        });
        if (response.s === "ok") {
          const { access_token, refresh_token } = response;
          await statesDbService.upsertState(this.getState().id, {
            access_token,
            refresh_token,
          });
          await statesDbService.upsertState("app", {
            refreshTokenExpiry: moment().add(10, "day").format(DDMMYYYY),
          });
        }
      }

      if (response.s === "ok") {
        const { access_token } = response;
        this.setAccessToken(access_token);
        return { access_token };
      } else {
        throw new Error(`Login failed: ${JSON.stringify(response)}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to login: ${error.message}`);
    }
  };

  getParams = () => ({
    token: this.getState().access_token,
    app_id: fyersAuthParams.app_id,
  });

  getHistory = async ({
    symbol,
    resolution,
    date_format = 1,
    range_from,
    range_to,
    cont_flag = 1,
  }: {
    symbol: string;
    resolution: string;
    date_format?: number;
    range_from: string;
    range_to: string;
    cont_flag?: number;
  }) => {
    try {
      const response = await fyers.getHistory({
        symbol,
        resolution,
        date_format,
        range_from,
        range_to,
        cont_flag,
      });

      if (response.s === "ok") {
        return {
          message: response.message || "Historical data retrieved successfully",
          data: response.candles
            ? {
                ...response,
                candles: Array.from(
                  new Map(
                    response.candles.map(
                      (candle: any) => [candle[0], candle] // use date as key
                    )
                  ).values()
                ),
              } // Get unique values
            : response,
        };
      }
      throw new Error(
        `Failed to fetch historical data: ${JSON.stringify(response)}`
      );
    } catch (error: any) {
      console.log(error);
      throw new Error(`Historical data error: ${error.message}`);
    }
  };

  getQuotes = async ({ symbols }: { symbols: string[] }) => {
    try {
      const response = await fyers.getQuotes(symbols);

      if (response.s === "ok") {
        return {
          message: response.message || "Historical data retrieved successfully",
          data: response,
        };
      }
      throw new Error(`Failed to fetch quotes:  ${JSON.stringify(response)}`);
    } catch (error: any) {
      console.log(error);
      throw new Error(`Quotes error: ${error.message}`);
    }
  };

  getOptionChain = async ({
    symbol,
    strikecount = 4,
  }: {
    symbol: string;
    strikecount?: number;
  }) => {
    try {
      const response = await fyers.getOptionChain({
        symbol,
        strikecount,
        timestamp: "",
      });

      if (response.s === "ok") {
        return {
          message: response.message || "Option chain retrieved successfully",
          data: {
            expiryData: response.data.expiryData,
            optionsChain: response.data.optionsChain,
          },
        };
      }
      throw new Error(
        `Failed to fetch option chain: ${JSON.stringify(response)}`
      );
    } catch (error: any) {
      console.log(error);
      throw new Error(`Option chain error: ${error.message}`);
    }
  };

  // placeOrder = (body = {}) => {
  //   const params = {
  //     ...this.getParams(),
  //     data: {
  //       qty: 1,
  //       type: 2,
  //       side: 1,
  //       productType: "Intraday",
  //       symbol: "NSE:INFY-EQ",
  //       limitPrice: 0,
  //       stopPrice: 0,
  //       disclosedQty: 0,
  //       validity: "DAY",
  //       offlineOrder: "false",
  //       stopPriceshould: 0,
  //       ...body,
  //     },
  //   };

  //   return fyers
  //     .place_order(params)
  //     .then((response) => {
  //       return { status: 200, data: response };
  //     })
  //     .catch((error) => {
  //       _error(error);
  //     });
  // };

  closeAllPositions = () => {};

  logout = async () => {
    logger.info("logging out from fyers");
    try {
      this.setAccessToken(null);
      this.pushToDB({ access_token: null });
      return true;
    } catch (error: any) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  };
}

const _fyers = new Fyers();

export default _fyers;
