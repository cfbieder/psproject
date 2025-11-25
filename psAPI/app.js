const pocketsmith = require("./pocketsmith");

const PS_API_KEY = process.env.PS_API_KEY;
const PS_USER_ID = process.env.PS_USER_ID;

if (!PS_API_KEY) {
  throw new Error("PS_API_KEY environment variable is required");
}

pocketsmith.auth(PS_API_KEY);
pocketsmith
  .getUsersId({ id: PS_USER_ID })
  .then(({ data }) => console.log(data))
  .catch((err) => console.error(err));

pocketsmith
  .getUsersIdTransaction_accounts({ id: PS_USER_ID })
  .then(({ data }) => console.log(data))
  .catch((err) => console.error(err));
