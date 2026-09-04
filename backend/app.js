const express = require("express");

const cors = require("cors");

const routes = require("./routes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "5mb",
  }),
);

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
