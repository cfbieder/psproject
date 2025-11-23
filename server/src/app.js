const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRouter = require("./routes/health");
const balanceRouter = require("./routes/balance");
const ingestRouter = require("./routes/ingestPs");
const app = express();

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/api/health", healthRouter);
app.use("/api/balance", balanceRouter);
app.use("/api", ingestRouter);

// URL of MongoDB server
var db = process.env.MONGO_URI;
console.log("[SERVER] Mongo URI: ", db);

app.get("/", (req, res) => {
  res.json({
    service: "fin-server",
    status: "running",
    routes: [
      "/api/health",
      "/api/balance",
      "/api/upload-ps",
      "/api/ingest-ps",
    ],
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

// Library for MongoDB
var mongoose = require("../../components/node_modules/mongoose");
//Connect to Mongoose
mongoose
  .connect(db, { serverSelectionTimeoutMS: 10000 }) // add timeout without deprecated opts
  .then(() => {
    console.log("[SERVER] Connected to MongoDB");
  })
  .catch((err) => {
    console.log(
      "[SERVER] Error:  Unable to connect to MongDB - make sure Mongo Docker is running"
    );
    process.exit();
  });

module.exports = app;
