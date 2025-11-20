const app = require("./app");

const port = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`[fin-server] listening on port ${port}`);
});
