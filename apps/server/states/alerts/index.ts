import { cloneDeep } from "lodash";
import State from "../state";
import { checkAlerts, filterCommonKeys } from "./functions";

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

  updateAlert = (drawingId: any, alertId: any, data: any) => {
    const alertsOfDrawing = cloneDeep(this.getState()[drawingId]);

    this.setState({
      [drawingId]: alertsOfDrawing.map((alert: any) =>
        alert.id === alertId ? { ...alert, ...data } : alert
      ),
      _db: true,
    });
  };
}

const _alerts = new Alerts();

export default _alerts;
