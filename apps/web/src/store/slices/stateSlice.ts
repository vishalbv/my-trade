import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { allStates } from "../../utils/constants";
// import { _allStates } from "../../helpers/constants";

// const defaultStates = _.fromPairs(_allStates.map((v) => [v.id, { ...v }]));
const initialState = allStates.reduce((acc: State, state: string) => {
  acc[state] = {};
  return acc;
}, {});

console.log("initialState", initialState);

interface State {
  [key: string]: any;
}

interface SetStatesByIDPayload {
  id: string;
  data: {
    _clearAndSet?: boolean;
    [key: string]: any;
  };
}

interface SetStatesByIDAndKeyPayload {
  id: string;
  key: string;
  data: any;
}

const stateReducer = createSlice({
  name: "state",
  initialState: initialState,
  reducers: {
    setAllStates: (state, action: PayloadAction<State>) => {
      return action.payload;
    },
    setStatesByID: (state, action: PayloadAction<SetStatesByIDPayload>) => {
      console.log("setStatesByID", action.payload);
      const { id, data } = action.payload;
      const { _clearAndSet, ...restData } = data;

      if (_clearAndSet) {
        state[id] = restData;
      } else {
        console.log("setting states", id, restData);
        state[id] = { ...state[id], ...restData };
        console.log("state", state);
      }
    },
    setStatesByIDAndKey: (
      state,
      action: PayloadAction<SetStatesByIDAndKeyPayload>
    ) => {
      const { id, key, data } = action.payload;
      state[id] = state[id] || {};
      state[id][key] = { ...state[id][key], ...data };
    },
  },
});

export const { setAllStates, setStatesByID, setStatesByIDAndKey } =
  stateReducer.actions;
export default stateReducer.reducer;
