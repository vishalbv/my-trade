import { postToStatesDB } from "../services/db.js";
import { NOTIFY } from "../services/notify.js";
import { getSocketRef } from "../utils/socketref.js";

// import { getSocketRef } from "../server/socket-server.js";

class State {
  state = {};
  refs = {};
  id;

  constructor(initialState) {
    this.state = initialState;
    this.initialState = initialState;
    this.id = initialState.id;
  }
  setState = this.updateState;
  getState = () => this.state;
  updateState = (newState, clearAndSet) => {
    const { _db, ..._newState } = newState || {};
    this.state = clearAndSet
      ? { ...this.initialState, ..._newState }
      : { ...this.state, ..._newState };

    this.pushState(_newState, clearAndSet);
    if (_db) this.pushToDB(_newState);
  };

  getRefs = () => this.refs;
  setRefs = (newRefs, clearAndSet) => {
    this.refs = clearAndSet ? newRefs : { ...this.refs, ...newRefs };
  };

  socketOn = (socket) => {
    socket.on(this.id, (_state) => {
      this.setState(_state);
    });
  };

  pushState = (newState, _clearAndSet) => {
    getSocketRef().emit(
      this.id,
      _clearAndSet
        ? { ...this.getState(), _clearAndSet }
        : { ...(newState || this.getState()), _clearAndSet }
    );
  };

  pushToDB = (newState) => {
    postToStatesDB(this.id, newState);
  };

  startingFunctionsAtInitialize = () => {};
  startingFunctionsAtLogout = () => {};
  updateDbAtInitOfDay = () => {};

  clearIntervalAndUpdate = (param) => {
    this.getRefs()[param] && clearInterval(this.getRefs()[param]);
    this.setRefs({ [param]: false });
    this.setState({ [param]: false });
  };
  setIntervalAndUpdate = (param, val) => {
    if (this.getRefs()[param]) {
      clearInterval(this.getRefs()[param]);
      NOTIFY.warn("something wrong in setIntervalAndUpdate");
    }
    this.setRefs({ [param]: val });
    this.setState({ [param]: !!val });
  };

  clearTimeoutAndUpdate = (param) => {
    this.getRefs()[param] && clearTimeout(this.getRefs()[param]);
    this.setRefs({ [param]: false });
    this.setState({ [param]: false });
  };
  setTimeoutAndUpdate = (param, val) => {
    this.getRefs()[param] && clearTimeout(this.getRefs()[param]);
    this.setRefs({ [param]: val });
    this.setState({ [param]: !!val });
  };
}

export default State;
