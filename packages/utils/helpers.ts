import moment from "moment";
import { DDMMYYYY } from "./constants";

export const isDatesEqual = (a: moment.Moment, b = moment()) =>
  a ? moment(a).format(DDMMYYYY) == moment(b).format(DDMMYYYY) : false;
