// import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { Drawing } from "../../components/Chart/types";

// interface DrawingsState {
//   [symbol: string]: Drawing[];
// }

// const initialState: DrawingsState = {};

// const drawingsSlice = createSlice({
//   name: "drawings",
//   initialState,
//   reducers: {
//     addDrawing: (
//       state,
//       action: PayloadAction<{ symbol: string; drawing: Drawing }>
//     ) => {
//       const { symbol, drawing } = action.payload;
//       if (!state[symbol]) {
//         state[symbol] = [];
//       }
//       state[symbol].push(drawing);
//     },

//     updateDrawing: (
//       state,
//       action: PayloadAction<{ symbol: string; drawing: Drawing }>
//     ) => {
//       const { symbol, drawing } = action.payload;
//       if (state[symbol]) {
//         const index = state[symbol].findIndex((d) => d.id === drawing.id);
//         if (index !== -1) {
//           state[symbol][index] = drawing;
//         }
//       }
//     },

//     deleteDrawing: (
//       state,
//       action: PayloadAction<{ symbol: string; drawingId: string }>
//     ) => {
//       const { symbol, drawingId } = action.payload;
//       if (state[symbol]) {
//         state[symbol] = state[symbol].filter((d) => d.id !== drawingId);
//       }
//     },

//     clearDrawings: (state, action: PayloadAction<string>) => {
//       const symbol = action.payload;
//       state[symbol] = [];
//     },
//   },
// });

// export const { addDrawing, updateDrawing, deleteDrawing, clearDrawings } =
//   drawingsSlice.actions;

// export default drawingsSlice.reducer;
