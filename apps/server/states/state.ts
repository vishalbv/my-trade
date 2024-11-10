import dbService from "../services/db.ts";
import notify from "../services/notification";
import statesDbService from "../services/statesDb";

import { sendMessage } from "../services/webSocket.ts";

class State {
  private state: Record<string, any>;
  private refs: Record<string, any>;
  private readonly initialState: Record<string, any>;
  readonly id: string;

  constructor(initialState: Record<string, any>) {
    this.state = { ...initialState };
    this.initialState = { ...initialState };
    this.refs = {};
    this.id = initialState.id;
  }

  getState = (): Record<string, any> => this.state;

  updateState = (
    newState: Record<string, any>,
    clearAndSet?: boolean
  ): void => {
    const { _db, ..._newState } = newState || {};
    this.state = clearAndSet
      ? { ...this.initialState, ..._newState }
      : { ...this.state, ..._newState };

    this.pushState(_newState, clearAndSet);
    if (_db) this.pushToDB(_newState);
  };
  setState = this.updateState;

  getRefs = (): Record<string, any> => this.refs;
  setRefs = (newRefs: Record<string, any>, clearAndSet?: boolean): void => {
    this.refs = clearAndSet ? { ...newRefs } : { ...this.refs, ...newRefs };
  };

  // This method is no longer needed as we're not using socket.io
  // socketOn = (socket: any): void => {
  //   socket.on(this.id, (state: Record<string, any>) => this.setState(state));
  // };

  pushState = (newState?: Record<string, any>, clearAndSet?: boolean): void => {
    sendMessage(
      this.id,
      clearAndSet
        ? { ...this.getState(), _clearAndSet: true }
        : { ...(newState || this.getState()), _clearAndSet: false }
    );
  };

  pushToDB = (newState: Record<string, any>): void => {
    statesDbService.upsertState(this.id, newState);
  };

  startingFunctionsAtInitialize = (): void => {};
  startingFunctionsAtLogout = (): void => {};
  updateDbAtInitOfDay = (): void => {};

  private clearAndUpdateTimer = (
    param: string,
    timerType: "interval" | "timeout"
  ): void => {
    const clearFunc = timerType === "interval" ? clearInterval : clearTimeout;
    if (this.refs[param]) clearFunc(this.refs[param]);
    this.refs[param] = false;
    this.state[param] = false;
  };

  private setAndUpdateTimer = (
    param: string,
    val: any,
    timerType: "interval" | "timeout"
  ): void => {
    this.clearAndUpdateTimer(param, timerType);
    this.refs[param] = val;
    this.state[param] = !!val;
  };

  clearIntervalAndUpdate = (param: string): void =>
    this.clearAndUpdateTimer(param, "interval");
  setIntervalAndUpdate = (param: string, val: any): void => {
    if (this.refs[param]) {
      notify.error("something wrong in setIntervalAndUpdate");
    }
    this.setAndUpdateTimer(param, val, "interval");
  };

  clearTimeoutAndUpdate = (param: string): void =>
    this.clearAndUpdateTimer(param, "timeout");
  setTimeoutAndUpdate = (param: string, val: any): void =>
    this.setAndUpdateTimer(param, val, "timeout");
}

export default State;
