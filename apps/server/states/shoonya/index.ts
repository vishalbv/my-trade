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
import { _shoonyaSocket, startShoonyaSocket } from "./socket";
import { fetchShoonyaNameByFyersSymbol, positionsFormatter } from "./functions";
import _symbols from "../symbols/index";
import { startMoneyManagementInterval } from "./moneyManagement";
import _app from "../app/index";

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

    if (_new?.moneyManage || _new?.fundInfo) {
      const { moneyManage, fundInfo } = this.getState();
      let _moneyManage = {
        ...moneyManage,
        maxLossOfDayInRs: (
          +fundInfo?.openBalance *
          (+moneyManage?.maxLossOfDay +
            (+moneyManage?.isExtendedMaxLossOfDay ? 15 : 0)) *
          0.01
        ).toFixed(),
      };
      this.updateState({ moneyManage: _moneyManage, _db: true });
    }

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
          _shoonyaSocket.subscribeTicks(
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
    this.getOrderBook();
    this.scripinfo("NSE", "26009");

    // Start money management monitoring
    startMoneyManagementInterval();
  };

  getOrderBook = () =>
    api
      .getOrderbook()
      .then(({ data }) => {
        console.log("data", data);
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

  loginDetails = async () => {
    const otp = await authenticator.generate(secret);
    const password = shoonyaAuthParams.password;
    return { data: { otp, password } };
  };

  closeAll = async ({
    type = "positions",
  }: {
    type: "positions" | "orders" | "indexOptions" | "stockOptions";
  }) => {
    try {
      // Get current positions
      const positionsResponse = await api.getPositions();
      const positions = positionsResponse.data;

      if (!positions || positions.stat === "Not_Ok") {
        return { success: true, message: "No positions to close" };
      }

      let positionsToClose = positions.filter(
        (position: any) => position.netqty !== "0"
      );

      // Filter based on type
      if (type === "indexOptions") {
        positionsToClose = positionsToClose.filter(
          (position: any) =>
            position.tsym.includes("NIFTY") ||
            position.tsym.includes("BANKNIFTY")
        );
      } else if (type === "stockOptions") {
        positionsToClose = positionsToClose.filter(
          (position: any) =>
            !position.tsym.includes("NIFTY") &&
            !position.tsym.includes("BANKNIFTY")
        );
      } else if (type === "orders") {
        // Cancel all pending orders
        const orderbook = await api.getOrderbook();
        const pendingOrders = orderbook.data.filter((order: any) =>
          ["OPEN", "PENDING"].includes(order.status)
        );

        const cancelPromises = pendingOrders.map((order: any) =>
          this.cancelOrder(order.norenordno)
        );

        await Promise.all(cancelPromises);
        return {
          success: true,
          message: `Cancelled ${cancelPromises.length} orders`,
        };
      }

      const closePromises = positionsToClose.map(async (position: any) => {
        const qty = Math.abs(parseInt(position.netqty));
        const side = parseInt(position.netqty) > 0 ? -1 : 1; // -1 for sell, 1 for buy

        return this.placeOrder({
          side,
          qty,
          shoonyaSymbol: position.tsym,
          exchange: position.exch,
        });
      });

      const results = await Promise.all(closePromises);

      return {
        success: true,
        data: results,
        message: `Closed ${closePromises.length} ${type}`,
      };
    } catch (error: any) {
      logger.error("Error closing positions:", error);
      throw new Error(`Failed to close positions: ${error.message}`);
    }
  };

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

  scripinfo = async (exchange: string, token: string) => {
    const data = await api.scripinfo(exchange, token);
    //its not providing data of lot size
    console.log("data-------", data);
    return data;
  };

  placeOrder = async (
    body: {
      side: number;
      qty?: number;
      type?: number;
      fyersSymbol?: string;
      shoonyaSymbol?: string;
      $index?: string;
      exchange?: string;
      price?: number;
      frzqty?: number;
      trigger_price?: number;
      order_type?: "SL-LMT" | "SL-MKT" | "LMT" | "MKT";
    },
    disableMoneyManage = false
  ) => {
    try {
      const {
        side,
        qty = 1,
        fyersSymbol,
        shoonyaSymbol,
        $index,
        exchange = "NSE",
        price,
        frzqty = qty,
        trigger_price,
        order_type,
      } = body;

      console.log("Placing order:", fyersSymbol, shoonyaSymbol, $index);
      const { testMode } = _app.getState();
      if (testMode) {
        return {
          data: {
            status: "Ok",
            norenordno: "1234567890",
            testmode: true,
          },
        };
      }

      const { exch, tsym } = fyersSymbol
        ? fetchShoonyaNameByFyersSymbol(fyersSymbol as any) || {}
        : { exch: null, tsym: null };

      const baseOrderParams = {
        buy_or_sell: side == 1 ? "B" : "S",
        product_type: "M",
        exchange: exch || exchange,
        tradingsymbol: tsym || shoonyaSymbol,
        discloseqty: 0,
        price_type: order_type || "MKT",
        price: order_type == "MKT" || order_type == "SL-MKT" ? 0 : price || 0,
        trigger_price: trigger_price || "None",
        retention: "DAY",
        remarks: "ALGO_SHOONYA",
      };

      const numOrders = Math.ceil(qty / frzqty);
      const responses = [];
      let remainingQty = qty;

      for (let i = 0; i < numOrders; i++) {
        const orderQty = Math.min(remainingQty, frzqty);
        const orderParams = {
          ...baseOrderParams,
          quantity: orderQty,
        };

        const response = await api.placeOrder(orderParams);
        responses.push(response.data);
        remainingQty -= orderQty;
      }

      return {
        data: responses.length === 1 ? responses[0] : responses,
      };
    } catch (error: any) {
      logger.error("Order placement failed", error);
      throw new Error(`Failed to place order: ${error.message}`);
    }
  };

  modifyOrder = async (body: {
    norenordno: string;
    price: number;
    qty: number;
    trigger_price: number;
  }) => {
    const { norenordno, price, qty, trigger_price } = body;

    try {
      const response = await api.modifyOrder({
        norenordno,
        price: price.toString(),
        qty: qty,
        trigger_price: trigger_price.toString(),
      });

      if (response.data?.stat === "Ok") {
        // Refresh order book after modification
        this.getOrderBook();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.emsg || "Failed to modify order");
      }
    } catch (error: any) {
      logger.error("Error modifying order:", error);
      throw new Error(`Failed to modify order: ${error.message}`);
    }
  };

  cancelOrder = async (norenordno: string) => {
    try {
      const response = await api.cancelOrder({
        norenordno,
      });

      if (response.data?.stat === "Ok") {
        // Refresh order book after cancellation
        this.getOrderBook();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.emsg || "Failed to cancel order");
      }
    } catch (error: any) {
      logger.error("Error canceling order:", error);
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  };
}

const _shoonya = new Shoonya();

export default _shoonya;
