import State from "../state";

const initialState = { id: "drawings" };

class Drawings extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
  };
}

const _drawings = new Drawings();

export default _drawings;
