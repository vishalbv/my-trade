import express from "express";

const app = express();
const port = process.env.PORT || 2300;

app.get("/", (req, res) => {
  res.send("Hello from Bun Express in Turborepo");
});

app.listen(port, () => {
  console.log(`Server at http://localhost:${port}`);
});
