import { fyersAuthParams, shoonyaAuthParams } from "@repo/utils/cred";
import State from "../state.js";
import { authenticator } from "otplib";

// import { checkAllLoginStatus } from "../app/functions.js";

// import _ticksFyersService from "../../services/ticks-fyers-service.js";
import logger from "../../services/logger.js";
import NorenRestApi from "../../services/shoonyaApi/RestApi";
import dbService from "../../services/db";
import { checkAllLoginStatus } from "../../utils/helpers";
import statesDbService from "../../services/statesDb";
import { shoonyaSocket, startShoonyaSocket } from "./socket";
import { positionsFormatter } from "./functions";

let api = new NorenRestApi();
const secret = "5GY64JV73GK3A676S6GC63463L33I535";

const initialState = { id: "shoonya" };

class Shoonya extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
    if (
      (_new.access_token && _old.access_token !== _new.access_token) ||
      fromDB
    ) {
      this.setAccessToken(_new.access_token);
    }
  };

  getPositions = () =>
    api
      .getPositions()
      .then(({ data }) => {
        // if data.stat == "Not_Ok" means till now no postions i took almost start of the day
        if (data.stat == "Not_Ok") {
          this.setState({
            positions: [],
            _db: true,
          });
        } else {
          shoonyaSocket.subscribeTicks(
            data.map((i: any) => i.exch + "|" + i.token)
          );
          this.setState(
            positionsFormatter({
              positions: data,
              currentState: this.getState(),
            })
          );
        }
      })
      .catch((e) => console.log(e));

  getFundInfo = async () => {
    console.log("getFundInfo");
    try {
      const res = await api.getLimits();

      console.log("res", res);
      if (res.statusText === "OK") {
        this.setState({
          fundInfo: {
            brokerage: 0,
            ...res.data,
            openBalance: +res.data.payin + +res.data.cash + +res.data.payout,
            pl: -1 * +res.data.premium,
            marginAvailable: (
              +res.data.payin +
              +res.data.cash +
              +res.data.payout -
              +(res.data.marginused || 0)
            ).toFixed(2),
          },
        });
      }
    } catch (error) {
      logger.error("error in getting fundinfo shoonya", error);
    }
  };

  initializeShoonya = async () => {
    console.log("initializing shoonya");
    this.getFundInfo();

    // Start the socket connection using the existing api instance
    await startShoonyaSocket(api);
    this.getPositions();
  };

  getOrderBook = () =>
    api
      .getOrderbook()
      .then(({ data }) => {
        this.setState({
          orderBook: data?.length && data.length > 0 ? data : [],
        });
      })
      .catch((e) => console.log(e));

  setAccessToken = (access_token: string | null) => {
    // fyers.setAccessToken(access_token);
    this.setState({ access_token });
    checkAllLoginStatus();

    api.setSessionDetails({
      actid: shoonyaAuthParams.userid,
      susertoken: access_token,
    });

    if (access_token) {
      this.initializeShoonya();
    }

    // _ticksFyersService.setAccessToken(access_token);
  };

  getAccessToken = () => this.getState().access_token;

  login = async () => {
    logger.info("logging to shoonya");
    try {
      const otp = await authenticator.generate(secret);
      const res = await api.login({ ...shoonyaAuthParams, twoFA: otp });

      if (res.status == 200) {
        if (res?.data?.stat == "Not_Ok") {
          throw new Error(res?.data?.emsg || "Login failed");
        }
        const access_token = res.data.susertoken;
        await statesDbService.upsertState(this.getState().id, { access_token });
        this.setAccessToken(access_token);

        return { access_token };
      } else {
        logger.error("login failed", res);
        throw new Error(res?.data?.emsg || "Login failed");
      }
    } catch (error: any) {
      logger.error("login failed", error);
      throw new Error(`Failed to login: ${error.message}`);
    }
  };

  closeAllPositions = () => {};

  logout = async () => {
    logger.info("logging out from shoonya");
    try {
      this.setAccessToken(null);
      this.pushToDB({ access_token: null });
      return true;
    } catch (error: any) {
      throw new Error(`Failed to logout: ${error.message}`);
    }
  };

  searchSymbol = async (exchange: string, text: string) => {
    try {
      const data = await api.searchscrip(exchange, text);
      if (!data?.data?.values) {
        throw new Error("No search results found");
      }
      return {
        data: data.data.values,
      };
    } catch (error: any) {
      logger.error("Symbol search failed", error);
      const errorMessage = error.response?.statusText || error.message;
      if (errorMessage.includes("Not Found")) {
        return {
          message: "No search results found",
          data: [],
        };
      } else {
        throw new Error(`Failed to search symbol: ${errorMessage}`);
      }
    }
  };
}

const _shoonya = new Shoonya();

export default _shoonya;
