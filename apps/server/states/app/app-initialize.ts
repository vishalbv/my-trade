// import { getStatesDBByID, postToStatesDB } from "../../services/db.js";
// import { NOTIFY } from "../../services/notify.js";
// import {
//   getIndexOfNew,
//   isDatesEqual,
//   renameKeys,
// } from "../../utils/helpers.js";
// import { logger } from "../../utils/logger.js";

import logger from "../../services/logger";
import { _allStates } from "../allstates";
import { isDatesEqual } from "@repo/utils/helpers";
import _app from "./index";
import dbService from "../../services/db";
import { checkAllLoginStatus } from "../../utils/helpers";
import statesDbService from "../../services/statesDb";

// import { checkAllLoginStatus } from "./functions.js";
// import fetch from "node-fetch";
// import moment from "moment";
// import _ from "lodash";
// import _ticksShoonyaService from "../../services/ticks-shoonya-service.js";
// import _ticksFyersService from "../../services/ticks-fyers-service.js";
// import _shoonya from "../shoonya/index.js";
// import _app from "./index.js";
// import { INDEX_DETAILS } from "../../utils/constants.js";
// import { _allStates } from "../all-states.js";

// // eslint-disable-next-line no-sparse-arrays
// // const col = [
// //   "id",
// //   "name",
// //   ,
// //   "lotSize",
// //   ,
// //   ,
// //   ,
// //   "lastDate",
// //   "expiryDate",

// //   "TradingSymbol",
// //   ,
// //   ,
// //   ,
// //   "mainSymbol",
// //   ,
// //   "strikePrice",
// //   "type",
// // ];

// // const _INDEXES = {
// //   symbols: ["BANKEX", "FINNIFTY", "BANKNIFTY", "NIFTY", "SENSEX"],
// //   _symbols: ["BANKEX", "FIN-NIFTY", "NIFTY-BANK", "NIFTY-50", "SENSEX"],
// // };

// // const setOptionsNames = async () => {
// //   logger("fetching  CSV data from server..... it may take longer time");
// //   await fetch("https://public.fyers.in/sym_details/NSE_FO.csv", {
// //     method: "get",
// //     headers: {
// //       "content-type": "text/csv;charset=UTF-8",
// //     },
// //   })
// //     .then(async (response) => await response.text())
// //     .then(async (data) => {
// //       const expirySymbols = await filterCSVdata(data);
// //       postToStatesDB("app", { expirySymbols });
// //       _app.setState({ expirySymbols });
// //     });
// //   return "success";
// // };

// const setOptionsNamesUpdated = async () => {
//   logger("new shoonya expiry symbols fetching strated");
//   const lpData = await _ticksFyersService.getQuotes(Object.keys(INDEX_DETAILS));

//   try {
//     let arr = await Promise.all(
//       Object.values(INDEX_DETAILS).map((i, index) => {
//         let mean = +(lpData[index].price / 100).toFixed() * 100;

//         let { strikeOffset: offset, exchange, shoonyaSearchName } = i;

//         return Promise.all(
//           Array.from({ length: 50 }).map((i, k) => {
//             let strike = mean - 25 * offset + k * offset;

//             return _ticksShoonyaService
//               .searchStocks(exchange, `${shoonyaSearchName} ${strike}`)
//               .then(({ data }) =>
//                 data.values
//                   .slice(0, 2)
//                   .map((i) => ({ ...i, type: i.optt, strikePrice: strike }))
//               )
//               .catch((e) =>
//                 logger(
//                   "error in setOptionsNamesUpdated shoonya searchStocks",
//                   e
//                 )
//               );
//           })
//         )
//           .then((data) => data.flat())
//           .catch((e) => console.log(e));
//       })
//     )
//       .then((data) => data)
//       .catch((e) => console.log(e));
//     const expirySymbols = Object.keys(INDEX_DETAILS).reduce(
//       (accumulator, key, index) => {
//         return { ...accumulator, [key]: arr[index] };
//       },
//       {}
//     );
//     logger("new shoonya expiry symbols fetching completed");

//     postToStatesDB("app", { expirySymbols });
//     _app.setState({ expirySymbols });
//   } catch (e) {
//     console.log(e);
//   }

//   // const ss = await arr;
//   // console.log(arr, "uuu");
//   // const expirySymbols = await filterCSVdata(data);

//   // price = lpData[_INDEXES.symbols.indexOf(val[0].mainSymbol)].price

//   // if (!lpData) return;

//   // searchStocks("NFO", "BANKNIFTY 42000").then((s) => console.log(s, "DD"));

//   //     const expirySymbols = await ;
//   //     postToStatesDB("app", { expirySymbols });
//   //     _app.setState({ expirySymbols });

//   // return "success";
// };

// // const getAllindicesData = () => {
// //   return Promise.all(
// //     INDICES.map((i) => getIndexData(i.replace("-", " ")))
// //   ).then((data) => {
// //     const indices = _mapper1(data);
// //     fetchPatchDB("app", { indices });
// //     _app.setState({ indices });
// //   });
// // };

const initializeStateFromDB = async () => {
  return Promise.all([
    ...Object.values(_allStates).map(async (i) => {
      const data = await statesDbService.getStateById(i.id);

      i.setState(data, true);
    }),
  ]);
  // fetchGetDB("patterns").then((data) => _app.setState({ patterns: data }));
};

const startingFunctionsAtInitialize = async () => {
  return Promise.all([
    ...Object.values(_allStates).map((i: any) => {
      i.startingFunctionsAtInitialize();
    }),
  ]);
  // fetchGetDB("patterns").then((data) => _app.setState({ patterns: data }));
};

// // const _mapper1 = (data) => {
// //   let obj = {};
// //   data.map(
// //     (i) =>
// //       (obj[i[0].symbol.replace(" ", "-")] = i.map((i) => i.symbol).slice(1))
// //   );
// //   return obj;
// // };

// // const _mapper2 = (data) => {
// //   let obj = {};
// //   data.map((i) => (obj[i.id] = i));
// //   return obj;
// // };

// // const filterCSVdata = async (data) => {
// //   logger("CSV filtering started");
// //   const lpData = await _ticksFyersService.getQuotes(_INDEXES._symbols);
// //   if (!lpData) return;
// //   const filtered = data
// //     .split("\n")
// //     .map((i) => {
// //       let obj = {};
// //       let arr = i.split(",");
// //       arr.map((i, k) => col[k] && (obj[col[k]] = i));

// //       return obj;
// //     })
// //     .filter(
// //       (i) =>
// //         i &&
// //         _INDEXES.symbols.some((s) => s == i.mainSymbol) &&
// //         new Date(0).setUTCSeconds(i.expiryDate) <
// //           moment().add(15, "days").valueOf()
// //     );

// //   let dummy = [];

// //   const filtered2 = _.mapValues(
// //     _.groupBy(filtered, (i) => i.mainSymbol),
// //     (val) => {
// //       let grouped = _.groupBy(val, (i) => i.expiryDate);

// //       return _.mapValues(grouped, (val, key) => {
// //         const price = lpData[_INDEXES.symbols.indexOf(val[0].mainSymbol)].price;
// //         const index = getIndexOfNew(
// //           val.map((i) => i.strikePrice),
// //           price
// //         );
// //         const arr = val
// //           .sort((a, b) => a.strikePrice - b.strikePrice)
// //           .slice(index - 50, index + 50);
// //         dummy = [...dummy, ...arr.map((i) => i.name)];
// //         return arr;
// //       });
// //     }
// //   );

// //   const tokens = await Promise.all(
// //     dummy.map(async (i) =>
// //       _ticksShoonyaService
// //         .searchStocks("NFO", _ticksShoonyaService.getOptionSymbol(i))
// //         .then(({ data }) => {
// //           return { ...(data.values[0] || {}), name: i };
// //         })
// //         .catch((e) => console.log(e))
// //     )
// //   );

// //   const filtered3 = _.mapValues(filtered2, (i) =>
// //     _.mapValues(i, (i) => {
// //       return i.map((i) => {
// //         const { token, tsym } = tokens.find((x) => x?.name == i?.name) || {};
// //         return {
// //           ...i,
// //           token,
// //           shoonyaSymbol: tsym,
// //         };
// //       });
// //     })
// //   );

// //   logger("CSV filtering completed");
// //   const newKeys = {};
// //   _INDEXES._symbols.map((i, k) => (newKeys[_INDEXES.symbols[k]] = i));

// //   return renameKeys(filtered3, newKeys);
// // };

// // const newArray = await Promise.all(
// //   val
// //     .sort(async (a, b) => a.strikePrice - b.strikePrice)
// //     .slice(index - 50, index + 50)
// //     .map(async (i) => {
// //       const [_data] = await _shoonya.searchscrip(
// //         "NFO",
// //         _shoonya.getOptionSymbol(i.name)
// //       );
// //       console.log({ _data });
// //       return {
// //         ...i,

// //         token: _data.token,
// //       };
// //     })
// // );

// // //calling all required fn to initialize app

// const updateDbAtInitOfDay = async () => {
//   // await postToStatesDB("app", {
//   //   dataUpdatedTime: moment().valueOf(),
//   // });
//   _app.setState({
//     dataUpdatedTime: moment().valueOf(),
//     _db: true,
//   });
//   _shoonya.setState({
//     positions: [],
//     tillLastTrade: 0,
//     noOfTrades: 0,
//     moneyManage: {
//       ..._shoonya.getState().moneyManage,
//       isExtendedMaxLossOfDay: false,
//     },
//     _db: true,
//   });
// };

const updateDbAtInitOfDay = async () => {
  return Promise.all([
    ...Object.values(_allStates).map((i) => i.updateDbAtInitOfDay()),
  ]);

  // fetchGetDB("patterns").then((data) => _app.setState({ patterns: data }));
};

const initializeApp = async () => {
  logger.info("initializing project state");
  // NOTIFY.info("Server Restared and initializing Backend State");
  await initializeStateFromDB();
  await checkAllLoginStatus();
  // await _ticksShoonyaService.startSocket();
  if (!isDatesEqual(_app.getState().dataUpdatedTime)) {
    // try {
    //   // await setOptionsNames();
    // //   await setOptionsNamesUpdated();
    // } catch (e) {
    //   logger.info("error in setOptionsNamesUpdated", e);
    // }
    await updateDbAtInitOfDay();
  }
  await startingFunctionsAtInitialize();
  logger.info("initializing project state completed");
};

export default initializeApp;
