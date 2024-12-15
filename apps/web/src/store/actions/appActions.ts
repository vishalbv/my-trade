import { postRequest } from "../../services/api";

export const preLogin = (body: any, autoLoginCallback: () => void) => {
  return postRequest(`preLogin`, body).then((data: any) => {
    if (data.autoLogin) {
      return autoLoginCallback();
    }
    window.open(data.authCodeURL, "_self");
    console.log(data);
  });
};

export const login = (body?: any) => {
  return postRequest(`login`, body).then((data: any) => {
    console.log(data);
  });
};

export const logout = (body?: any) => {
  return postRequest(`logout`, body).then((data: any) => {
    console.log(data);
  });
};

export const getHistory = (body: any) => {
  return postRequest(`history`, body);
};

export const searchSymbol = (body: any) => {
  return postRequest(`searchSymbol`, body);
};

export const getOptionChain = (body: any) => {
  return postRequest(`optionChain`, body);
};

export const generateReport = (body: any) => {
  return postRequest(`generateReport`, body);
};

export const getReports = (body: any) => {
  return postRequest(`getReports`, body);
};
