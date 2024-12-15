export interface Report {
  _id: {
    $oid: string;
  };
  id: string;
  app: {
    doneForTheDay: null | boolean;
  };
  shoonya: {
    fundInfo: {
      brokerage: number;
      cash: string;
      pl: number;
      marginAvailable: string;
      openBalance: number;
    };
    moneyManage: {
      maxLoss: string;
      MaxLoss: number;
      maxLossOfDay: string;
      noOfTrades: string;
      maxNoOfTrades: number;
      securePercentage: string;
    };
    positions: any[];
  };
}
