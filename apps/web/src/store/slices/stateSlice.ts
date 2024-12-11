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
  name: "states",
  initialState: initialState,
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
    addItemToKeyOfId: (
      state,
      action: PayloadAction<{ id: string; key: string; data: any }>
    ) => {
      const { id, key, data } = action.payload;

      if (!state[id][key]) {
        state[id][key] = [];
      }
      state[id][key].push(data);
    },

    updateItemInKeyOfId: (
      state,
      action: PayloadAction<{ id: string; key: string; data: any }>
    ) => {
      const { id, key, data } = action.payload;
      if (state[id][key]) {
        const index = state[id][key].findIndex((d: any) => d.id === data.id);
        if (index !== -1) {
          state[id][key][index] = { ...state[id][key][index], ...data };
        }
      }
    },

    deleteItemInKeyOfId: (
      state,
      action: PayloadAction<{ id: string; key: string; data: any }>
    ) => {
      const { id, key, data } = action.payload;
      if (state[id][key]) {
        state[id][key] = state[id][key].filter((d: any) => d.id !== data.id);
      }
    },

    clearItemsInKeyOfId: (
      state,
      action: PayloadAction<{ id: string; key: string }>
    ) => {
      const { id, key } = action.payload;
      state[id][key] = [];
    },
  },
});

export const {
  setAllStates,
  setStatesByID,
  setStatesByIDAndKey,
  addItemToKeyOfId,
  updateItemInKeyOfId,
  deleteItemInKeyOfId,
  clearItemsInKeyOfId,
} = stateReducer.actions;
export default stateReducer.reducer;
