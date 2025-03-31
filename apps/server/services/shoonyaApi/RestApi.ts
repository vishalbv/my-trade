// @ts-nocheck
import axios from "axios";
import sha256 from "crypto-js/sha256";
import { API } from "./config.js";
import WS from "./WebSocket.js";

class NorenRestApi {
  #susertoken = "";
  #username = "";
  #accountid = "";
  #webSocket = null;
  broker: string;
  constructor(broker: string) {
    this.broker = broker;
    this.endpoint = API[broker].endpoint;
    this.debug = API[broker].debug;
    this.routes = {
      authorize: "/QuickAuth",
      logout: "/Logout",
      forgot_password: "/ForgotPassword",
      watchlist_names: "/MWList",
      watchlist: "/MarketWatch",
      watchlist_add: "/AddMultiScripsToMW",
      watchlist_delete: "/DeleteMultiMWScrips",
      placeorder: "/PlaceOrder",
      modifyorder: "/ModifyOrder",
      cancelorder: "/CancelOrder",
      exitorder: "/ExitSNOOrder",
      orderbook: "/OrderBook",
      tradebook: "/TradeBook",
      singleorderhistory: "/SingleOrdHist",
      searchscrip: "/SearchScrip",
      TPSeries: "/TPSeries",
      optionchain: "/GetOptionChain",
      holdings: "/Holdings",
      limits: "/Limits",
      positions: "/PositionBook",
      scripinfo: "/GetSecurityInfo",
      getquotes: "/GetQuotes",
    };
  }

  async #postRequest(route, params) {
    const url = this.endpoint + this.routes[route];
    const payload = `jData=${JSON.stringify(params)}${
      this.#susertoken ? `&jKey=${this.#susertoken}` : ""
    }`;

    console.log("Request URL:", url);
    console.log("Request Payload:", payload);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false,
        }),
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes less than 500
        },
      });

      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);

      return response;
    } catch (error) {
      console.error("Post Request Error:", {
        url,
        route,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  setSessionDetails(response) {
    console.log("setSessionDetails", response);
    this.#susertoken = response.susertoken;
    this.#username = response.actid;
    this.#accountid = response.actid;
  }

  async login({ userid, password, twoFA, vendor_code, api_secret, imei }) {
    const pwd = sha256(password).toString();
    const u_app_key = `${userid}|${api_secret}`;
    const app_key = sha256(u_app_key).toString();

    const authParams = {
      source: "API",
      apkversion: "js:1.0.0",
      uid: userid,
      pwd,
      factor2: twoFA,
      vc: vendor_code,
      appkey: app_key,
      imei,
    };

    try {
      const response = await this.#postRequest("authorize", authParams);
      if (response.stat === "Ok") {
        this.setSessionDetails(response);
      }
      return response;
    } catch (err) {
      throw err;
    }
  }

  async searchscrip(exchange, searchtext) {
    try {
      const values = {
        uid: this.#username,
        exch: exchange,
        stext: searchtext,
      };
      const response = await this.#postRequest("searchscrip", values);

      // Log the full response for debugging
      console.log("SearchScrip Response:", response);

      // Check if response exists and has data
      if (!response || !response.data) {
        throw new Error("Invalid response from Shoonya API");
      }

      return response;
    } catch (error) {
      console.error("SearchScrip Error:", error);
      // If it's an axios error, log more details
      if (error.response) {
        console.error("Error Response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      throw error;
    }
  }

  async scripinfo(exchange, token) {
    const values = {
      uid: this.#username,
      exch: exchange,
      token,
    };
    return this.#postRequest("scripinfo", values);
  }

  async getQuotes(exchange, token) {
    const values = {
      uid: this.#username,
      exch: exchange,
      token,
    };
    return this.#postRequest("getquotes", values);
  }

  async getTimePriceSeries({ exchange, token, starttime, endtime, interval }) {
    const values = {
      uid: this.#username,
      exch: exchange,
      token,
      st: starttime,
      ...(endtime && { et: endtime }),
      ...(interval && { intrv: interval }),
    };
    return this.#postRequest("TPSeries", values);
  }

  async placeOrder(order) {
    const values = {
      ordersource: "API",
      uid: this.#username,
      actid: this.#accountid,
      trantype: order.buy_or_sell,
      prd: order.product_type,
      exch: order.exchange,
      tsym: order.tradingsymbol,
      qty: order.quantity.toString(),
      dscqty: order.discloseqty.toString(),
      prctyp: order.price_type,
      prc: order.price.toString(),
      remarks: order.remarks,
      ret: order.retention || "DAY",
      ...(order.trigger_price && { trgprc: order.trigger_price.toString() }),
      ...(order.amo && { amo: order.amo }),
    };

    if (order.product_type === "H") {
      values.blprc = order.bookloss_price.toString();
      if (order.trail_price !== 0) {
        values.trailprc = order.trail_price.toString();
      }
    }

    if (order.product_type === "B") {
      values.blprc = order.bookloss_price.toString();
      values.bpprc = order.bookprofit_price.toString();
      if (order.trail_price !== 0) {
        values.trailprc = order.trail_price.toString();
      }
    }

    return this.#postRequest("placeorder", values);
  }

  async modifyOrder(modifyParams) {
    const values = {
      ordersource: "API",
      uid: this.#username,
      actid: this.#accountid,
      norenordno: modifyParams.orderno,
      exch: modifyParams.exchange,
      tsym: modifyParams.tradingsymbol,
      qty: modifyParams.newquantity.toString(),
      prctyp: modifyParams.newprice_type,
      prc: modifyParams.newprice.toString(),
    };

    if (["SL-LMT", "SL-MKT"].includes(modifyParams.newprice_type)) {
      values.trgprc = modifyParams.newtrigger_price.toString();
    }

    if (modifyParams.bookloss_price) {
      values.blprc = modifyParams.bookloss_price.toString();
    }
    if (modifyParams.trail_price) {
      values.trailprc = modifyParams.trail_price.toString();
    }
    if (modifyParams.bookprofit_price) {
      values.bpprc = modifyParams.bookprofit_price.toString();
    }

    return this.#postRequest("modifyorder", values);
  }

  async cancelOrder(orderno) {
    return this.#postRequest("cancelorder", {
      ordersource: "API",
      uid: this.#username,
      norenordno: orderno,
    });
  }

  async exitOrder(orderno, product_type) {
    return this.#postRequest("exitorder", {
      uid: this.#username,
      norenordno: orderno,
      prd: product_type,
    });
  }

  async getOrderbook() {
    return this.#postRequest("orderbook", { uid: this.#username });
  }

  async getTradebook() {
    return this.#postRequest("tradebook", {
      uid: this.#username,
      actid: this.#accountid,
    });
  }

  async getHoldings(product_type = "C") {
    return this.#postRequest("holdings", {
      uid: this.#username,
      actid: this.#accountid,
      prd: product_type,
    });
  }

  async getPositions() {
    return this.#postRequest("positions", {
      uid: this.#username,
      actid: this.#accountid,
    });
  }

  async getLimits(product_type = "", segment = "", exchange = "") {
    const values = {
      uid: this.#username,
      actid: this.#accountid,
      ...(product_type && { prd: product_type }),
      ...(segment && { seg: segment }),
      ...(exchange && { exch: exchange }),
    };
    return this.#postRequest("limits", values);
  }

  async startWebsocket(callbacks) {
    this.#webSocket = new WS({
      url: API[this.broker].websocket,
      apikey: this.#susertoken,
    });

    const params = {
      uid: this.#username,
      actid: this.#username,
      apikey: this.#susertoken,
    };

    await this.#webSocket.connect(params, callbacks);
    console.log("ws is connected");
  }

  subscribe(instrument, feedtype) {
    if (!this.#webSocket) throw new Error("WebSocket not connected");
    this.#webSocket.send(JSON.stringify({ t: "t", k: instrument }));
  }
}

export default NorenRestApi;
