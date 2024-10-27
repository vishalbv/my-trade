import { postRequest } from "../../services/api";

export const preLogin = (body: any) => {
  postRequest(`preLogin`, body).then((data) => {
    window.open(data.authCodeURL, "_self");
    console.log(data);
  });
};
