import moment from "moment";
import State from "../state.ts";
import { updateMarketStatus } from "./functions";
// import { updateMarketStatus } from "./functions.js";
// import { INDEX_DETAILS } from "../../utils/constants.js";
// import _ticksFyersService from "../../services/ticks-fyers-service.js";

const initialState = { id: "app", loggedIn: false };

class App extends State {
  constructor() {
    super(initialState);
  }

  setState = (_new: any, fromDB?: boolean) => {
    const _old = this.getState();
    console.log({ _old, _new });
    this.updateState(_new, fromDB);
  };
  isLoggedIn = () => this.getState().access_token;
  isInTestMode = () => this.getState().testMode;

  startingFunctionsAtInitialize = () => {
    updateMarketStatus((data: any) => this.setState({ marketStatus: data }));
    // _ticksFyersService
    //   .getQuotes(Object.keys(INDEX_DETAILS))
    //   .then((data) => this.setState({ indexPrices: data }))
    //   .catch((error) => this.setState({ indexPrices: [] }));
  };

  updateDbAtInitOfDay = () => {
    this.setState({
      dataUpdatedTime: moment().valueOf(),
      doneForTheDay: undefined,
      testMode: false,
      _db: true,
    });
  };

  // updateMarketStatus = () => {
  //   if (this.getRefs().marketStatusInterval)
  //     clearInterval(this.getRefs().marketStatusInterval);
  //   const marketStatusInterval = setInterval(() => {
  //     this.setState({ marketStatus: getMarketStatus() });
  //   }, 1000);

  //   this.setRefs({ marketStatusInterval });
  // };
}

const _app = new App();

export default _app;
