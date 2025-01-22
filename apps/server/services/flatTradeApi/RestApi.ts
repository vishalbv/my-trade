import axios, { AxiosInstance } from "axios";
import FlatTradeAuth from "./auth";
import NorenRestApi from "../shoonyaApi/RestApi";

export class FlatTradeRestApi extends NorenRestApi {
  private axios: AxiosInstance;
  private baseUrl = "https://piconnect.flattrade.in/PiConnectTP";
  private wsUrl = "wss://piconnect.flattrade.in/PiConnectWSTp";
  private eodUrl = "https://web.flattrade.in/chartApi/getdata";

  constructor() {
    super("flattrade");
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async login() {
    try {
      const authResponse = await FlatTradeAuth.login();
      return {
        status: 200,
        data: {
          access_token: authResponse.token,
        },
      };
    } catch (error: any) {
      return {
        status: 400,
        message: error.message,
      };
    }
  }

  // ... rest of your API methods
}

export default FlatTradeRestApi;
