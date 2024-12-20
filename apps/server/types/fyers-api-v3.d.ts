declare module "fyers-api-v3" {
  export class fyersModel {
    setAppId(appId: string): void;
    setRedirectUrl(url: string): void;
    setAccessToken(token: string | null): void;
    generateAuthCode(): string;
    generate_access_token(params: {
      client_id: string;
      secret_key: string;
      auth_code: string;
    }): Promise<any>;
    place_order(params: any): Promise<any>;
    getHistory(params: any): Promise<any>;
    getQuotes(params: any): Promise<any>;
    getOptionChain(params: any): Promise<any>;
  }
}
