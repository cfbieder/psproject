const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRouter = require("./routes/health");
const balanceRouter = require("./routes/balance");
const app = express();

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/api/health", healthRouter);
app.use("/api/balance", balanceRouter);

app.get("/", (req, res) => {
  res.json({
    service: "fin-server",
    status: "running",
    routes: ["/api/health", "/api/balance"],
  });
});

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res) => {
  res.status(err.status || 500).json({
    error: err.message,
    status: err.status || 500,
  });
});

module.exports = app;
