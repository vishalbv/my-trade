import State from "../state";

const initialState = { id: "symbols", fyersToShoonyaMapping: {} };

class Symbols extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
  };
}

const _symbols = new Symbols();

export default _symbols;
