import axios from "axios";

async function askOllama() {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt:
        "Based on the last 300 candles, identify the most recent two swings. If Index's latest swing high is lower than the previous swing high, but CE's swing is not, what does that indicate about bullish divergence or momentum shift? Respond only with your conclusion and reasoning.",
      stream: false,
    });

    console.log("🧠 Response from Ollama:\n", response.data.response);
  } catch (err) {
    console.error("❌ Error querying Ollama:", err.message);
  }
}

askOllama();
