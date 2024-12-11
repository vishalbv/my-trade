import State from "../state";

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
}

const _alerts = new Alerts();

export default _alerts;
