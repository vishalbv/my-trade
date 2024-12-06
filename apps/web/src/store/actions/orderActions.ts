import { postRequest } from "../../services/api";

export const placeOrder = (body: any) => {
  return postRequest(`placeOrder`, body);
};
