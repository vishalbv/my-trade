import axios from "axios";
import crypto from "crypto";
import { authenticator } from "otplib";

const flatTradeAuthParams = {
  apiKey: "5e4475c6c17742bfb137cfa6a02e8379",
  secretKey: "2025.534937e360e244df86e7aea1a954a56a1f78aa1b39e009c0",
  totpKey: "MELKJBFDWTFGJ46XG2NCC447XEIG44N3",
  password: "Flat!23456",
  userid: "FZ08557",
};
const headerJson = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36",
  Referer: "https://auth.flattrade.in/",
};

interface LoginResponse {
  token: string;
  status: string;
  message?: string;
}

export class FlatTradeAuth {
  private apiKey: string;
  private secretKey: string;
  private totpKey: string;
  private password: string;
  private userId: string;
  private maxRetries: number = 2;
  private retryDelay: number = 5000; // 5 seconds

  constructor() {
    this.apiKey = flatTradeAuthParams.apiKey;
    this.secretKey = flatTradeAuthParams.secretKey;
    this.totpKey = flatTradeAuthParams.totpKey;
    this.password = flatTradeAuthParams.password;
    this.userId = flatTradeAuthParams.userid;
  }

  private generateTOTP(): string {
    // Note: You'll need to implement TOTP generation
    // You can use 'otplib' npm package for this
    return authenticator.generate(this.totpKey);
  }

  private sha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private parseUrl(url: string): { code: string } {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get("code");
    if (!code) throw new Error("No code found in redirect URL");
    return { code };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async login(): Promise<LoginResponse> {
    try {
      // Create session
      const sessionResponse = await axios.post(
        "https://authapi.flattrade.in/auth/session",
        {},
        { headers: headerJson }
      );
      const sid = sessionResponse.data;
      console.log("sid:", sid);

      // Generate encrypted password
      const passwordEncrypted = this.sha256(this.password);

      // Authentication request
      const authPayload = {
        UserName: this.userId,
        Password: passwordEncrypted,
        PAN_DOB: this.generateTOTP(),
        App: "",
        ClientID: "",
        Key: "",
        APIKey: this.apiKey,
        Sid: sid,
        Override: "Y",
        Source: "AUTHPAGE",
      };

      const authResponse = await axios.post(
        "https://authapi.flattrade.in/ftauth",
        authPayload,
        { headers: headerJson }
      );

      const reqCodeRes = authResponse.data;
      console.log("Auth Response:", reqCodeRes);

      // Parse request code from redirect URL
      const { code: reqCode } = this.parseUrl(reqCodeRes.RedirectURL);

      // Generate API secret
      const apiSecretRaw = this.apiKey + reqCode + this.secretKey;
      const apiSecret = this.sha256(apiSecretRaw);

      // Get token
      const tokenPayload = {
        api_key: this.apiKey,
        request_code: reqCode,
        api_secret: apiSecret,
      };

      const tokenResponse = await axios.post(
        "https://authapi.flattrade.in/trade/apitoken",
        tokenPayload
      );

      const { token } = tokenResponse.data;

      return {
        token,
        status: "success",
      };
    } catch (error: any) {
      console.error("Login Failed:", error.message);
      throw new Error(`Login failed: ${error.message}`);
    }
  }
}

export default new FlatTradeAuth();
