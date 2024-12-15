import { postRequest } from "../../services/api";

export const placeOrder = (body: any) => {
  return postRequest(`placeOrder`, body);
};

export const modifyOrder = (body: any) => {
  return postRequest(`modifyOrder`, body);
};

export const cancelOrder = (body: any) => {
  return postRequest(`cancelOrder`, body);
};

export const closeAll = (body: any) => {
  return postRequest(`closeAll`, body);
};
