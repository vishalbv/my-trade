import State from "../state";
import { checkAlerts } from "./functions";

const initialState = { id: "alerts" };

class Alerts extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
  };

  startingFunctionsAtInitialize = () => {
    checkAlerts();
  };
}

const _alerts = new Alerts();

export default _alerts;
