import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { _allStates } from "../../helpers/constants";

// const defaultStates = _.fromPairs(_allStates.map((v) => [v.id, { ...v }]));
// const initialState = {
//   ...defaultStates,
//   global: {},
//   ticks_shoonya: {},
//   notifications: [],
//   reports: {},
//   tasks: {},
//   notes: {},
// };

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

const rootReducer = createSlice({
  name: "_global",
  initialState: {} as State,
  reducers: {
    setAllStates: (state, action: PayloadAction<State>) => {
      return action.payload;
    },
    setStatesByID: (state, action: PayloadAction<SetStatesByIDPayload>) => {
      const { id, data } = action.payload;
      const { _clearAndSet, ...restData } = data;

      if (_clearAndSet) {
        state[id] = restData;
      } else {
        state[id] = { ...state[id], ...restData };
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
  rootReducer.actions;
export default rootReducer.reducer;
