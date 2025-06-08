import axios from "axios";
import crypto from "crypto";

// Your API credentials
const API_KEY = "iJVBBHfGHXycq8naY3Mep1SJZt79fG";
const API_SECRET =
  "EY40LlGP8boH4R0gwvOyV0FPK6rVWLmHsednKqmeTA21me4ZFHEJi5dRRyLs";

// Base URL (testnet or live)
const BASE_URL = "https://api.india.delta.exchange"; // use 'https://testnet-api.delta.exchange' for testnet

async function getWalletBalances() {
  const method = "GET";
  const path = "/v2/wallet/balances";
  const timestamp = Math.floor(Date.now() / 1000).toString(); // must be in seconds

  // Construct signature
  const signaturePayload = `${method}${timestamp}${path}`;
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(signaturePayload)
    .digest("hex");

  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers: {
        "api-key": API_KEY,
        timestamp: timestamp,
        signature: signature,
      },
    });

    console.log("✅ Wallet Balances:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function getMarketPrice(instrument_id) {
  // Get current market price (Last Traded Price) for the instrument
  try {
    const res = await axios.get(`${BASE_URL}/v2/instruments/${instrument_id}`);
    return res.data.result.last_traded_price; // Check exact field from API docs
  } catch (err) {
    console.error(
      "Failed to fetch market price:",
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getOHLCData() {
  const url = "https://api.india.delta.exchange/v2/history/candles";

  const params = {
    resolution: "5m",
    symbol: "BTCUSD", // or any supported symbol
    start: 1685618835, // in seconds
    end: 1722511635, // in seconds
  };

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
      },
      params,
    });

    console.log("✅ OHLC Data:", response.data);
  } catch (error) {
    console.error(
      "❌ Error fetching OHLC data:",
      error.response?.data || error.message
    );
  }
}

function generateSignature(method, path, nonce, body = "") {
  const message = method + nonce + path + body;
  return crypto.createHmac("sha256", API_SECRET).update(message).digest("hex");
}

async function placeOrder({
  instrument_id,
  lot = 1,
  sl_points = 100,
  target_points = 100,
  offset_points = 10,
  side = "buy", // or 'sell'
  order_type = "limit", // or 'market'
}) {
  try {
    // 1. Get current market price
    const marketPrice = await getMarketPrice(instrument_id);

    // 2. Calculate entry price 10 points below market price (for buy)
    const entryPrice =
      side === "buy"
        ? marketPrice - offset_points
        : marketPrice + offset_points;

    // 3. Calculate SL and Target prices
    const stopLossPrice =
      side === "buy" ? entryPrice - sl_points : entryPrice + sl_points;
    const takeProfitPrice =
      side === "buy" ? entryPrice + target_points : entryPrice - target_points;

    // 4. Prepare order payload
    const bodyObj = {
      instrument_id,
      quantity: lot,
      price: entryPrice.toFixed(2),
      side, // buy/sell
      type: order_type, // limit or market
      stop_loss: stopLossPrice.toFixed(2),
      take_profit: takeProfitPrice.toFixed(2),
      time_in_force: "GTC", // Good till cancel or use as needed
    };

    const path = "/v2/orders";
    const nonce = Date.now().toString();

    const method = "POST";

    const timestamp = Math.floor(Date.now() / 1000).toString(); // must be in seconds

    const bodyStr = JSON.stringify(bodyObj);
    const signaturePayload = `${method}${timestamp}${path}${bodyStr}`;

    const signature = crypto
      .createHmac("sha256", API_SECRET)
      .update(signaturePayload)
      .digest("hex");

    // 5. Call place order API
    const res = await axios.post(BASE_URL + path, bodyObj, {
      headers: {
        APIKey: API_KEY,
        Nonce: nonce,
        Signature: signature,
        "Content-Type": "application/json",
      },
    });

    console.log("Order placed:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Error placing order:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getInstruments() {
  try {
    const response = await fetch(BASE_URL + "/v2/instruments", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // data.result is the array of instruments
    return data.result;
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return null;
  }
}

// Example usage:
// getInstruments().then((instruments) => {
//   if (instruments) {
//     // Filter BTC futures
//     const btcFutures = instruments.filter(
//       (inst) => inst.symbol.includes("BTC") && inst.kind === "future"
//     );
//     console.log("BTC Futures:", btcFutures);
//   }
// });

// Usage example:
// Replace instrument_id with your instrument's id
// placeOrder({
//   instrument_id: 12345,
//   lot: 1,
//   sl_points: 100,
//   target_points: 100,
//   offset_points: 10,
//   side: "buy",
//   order_type: "limit",
// });

// getOHLCData();

// getWalletBalances();

async function placeBracketOrder() {
  const method = "POST";
  const path = "/v2/orders/bracket";
  const url = "https://api.india.delta.exchange" + path;

  const payload = {
    // product_id: 27, // Replace with actual product id
    product_symbol: "BTCUSD", // Replace with actual symbol
    quantity: 1, // Order quantity (e.g., 1 lot)
    price: null, // null for market order, or specify price for limit order
    side: "buy", // 'buy' or 'sell'
    order_type: "market", // 'market' or 'limit'
    bracket_stop_loss_limit_price: "54000",
    bracket_stop_loss_price: "55000",
    bracket_take_profit_limit_price: "58000",
    bracket_take_profit_price: "57000",
    bracket_trail_amount: "50",
    bracket_stop_trigger_method: "last_traded_price",
  };

  const jsonPayload = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Create signature string
  const signatureData = method + timestamp + path + jsonPayload;

  // Generate HMAC SHA256 signature
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(signatureData)
    .digest("hex");

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": API_KEY,
        signature,
        timestamp,
      },
    });

    console.log("Order Response:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

placeBracketOrder();

// function generateSignature(method, timestamp, path, body = "") {
//   return crypto
//     .createHmac("sha256", API_SECRET)
//     .update(method + timestamp + path + body)
//     .digest("hex");
// }

async function placeMarketOrder() {
  const method = "POST";
  const path = "/v2/orders";
  const url = BASE_URL + path;

  const body = {
    product_id: 27, // BTCUSD product ID
    product_symbol: "BTCUSD",
    size: 1,
    side: "buy",
    order_type: "market_order", // Changed to match API schema
    time_in_force: "gtc",
    post_only: false,
    reduce_only: false,
    mmp: "disabled",
    client_order_id: Date.now().toString(), // Unique order ID
  };

  const bodyStr = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signaturePayload = `${method}${timestamp}${path}${bodyStr}`;

  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(signaturePayload)
    .digest("hex");

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": API_KEY,
        signature: signature,
        timestamp: timestamp,
      },
    });
    console.log("Order Response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.data);
      console.error("Request body:", body);
      console.error("Request headers:", {
        "api-key": API_KEY,
        timestamp: timestamp,
        // signature hidden for security
      });
    }
    throw error.response ? error.response.data : error;
  }
}

async function main() {
  try {
    console.log("Placing market order...");
    const marketOrderRes = await placeMarketOrder();
    console.log("Market order response:", marketOrderRes);

    // Use average price from filled order to calculate bracket order prices
    const avgPrice = marketOrderRes.data.avg_price || marketOrderRes.data.price;
    if (!avgPrice) {
      throw new Error("Average price not found in order response");
    }

    // console.log('Placing bracket order with avgPrice:', avgPrice);
    // const bracketOrderRes = await placeBracketOrder(avgPrice);
    // console.log('Bracket order response:', bracketOrderRes);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
// getWalletBalances();
