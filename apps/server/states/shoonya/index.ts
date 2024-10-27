// @ts-nocheck
import { fyersAuthParams } from "@repo/utils/cred";
import State from "../state.js";
import { fyersModel } from "fyers-api-v3";

// import { checkAllLoginStatus } from "../app/functions.js";
import { REDIRECT_URL } from "@repo/utils/constants";
// import _ticksFyersService from "../../services/ticks-fyers-service.js";
import logger from "../../services/logger.js";

const fyers = new fyersModel();
fyers.setAppId(fyersAuthParams.app_id);
fyers.setRedirectUrl(REDIRECT_URL);

const initialState = { id: "fyers" };

class Fyers extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new, fromDB) => {
    const _old = this.state;
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
    } catch (error) {
      throw new Error(`Failed to generate auth code: ${error.message}`);
    }
  };

  setAccessToken = (access_token) => {
    fyers.setAccessToken(access_token);
    this.setState({ access_token });
    // checkAllLoginStatus();
    _ticksFyersService.setAccessToken(access_token);
  };

  getAccessToken = () => this.state.access_token;

  login = async (body) => {
    logger.info("logging to fyers", fyersAuthParams);

    try {
      const response = await fyers.generate_access_token({
        client_id: fyersAuthParams.app_id,
        secret_key: fyersAuthParams.secret_key,
        auth_code: body.auth_code,
      });

      if (response.s === "ok") {
        const { access_token } = response;
        // await postToStatesDB(this.state.id, { access_token });
        this.setAccessToken(access_token);
        return _success({ access_token });
      } else {
        return _error(response);
      }
    } catch (error) {
      return _error(error);
    }
  };

  getParams = () => ({
    token: this.getState().access_token,
    app_id: fyersAuthParams.app_id,
  });

  placeOrder = (body = {}) => {
    const params = {
      ...this.getParams(),
      data: {
        qty: 1,
        type: 2,
        side: 1,
        productType: "Intraday",
        symbol: "NSE:INFY-EQ",
        limitPrice: 0,
        stopPrice: 0,
        disclosedQty: 0,
        validity: "DAY",
        offlineOrder: "false",
        stopPriceshould: 0,
        ...body,
      },
    };

    return fyers
      .place_order(params)
      .then((response) => {
        return { status: 200, data: response };
      })
      .catch((error) => {
        _error(error);
      });
  };

  closeAllPositions = () => {};

  logout = () => {
    this.setAccessToken(null);
    postToStatesDB(this.state.id, { access_token: null });
    return _success();
  };
}

const _fyers = new Fyers();

export default _fyers;
