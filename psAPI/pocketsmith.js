const BASE_URL = "https://api.pocketsmith.com/v2";

let apiKey;

const auth = (key) => {
  apiKey = key;
};

const request = async (path) => {
  if (!apiKey) {
    throw new Error("Pocketsmith API key is not set. Call auth() first.");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Developer-Key": apiKey,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Pocketsmith request failed (${response.status}): ${text}`);
  }

  return text ? JSON.parse(text) : null;
};

const getUsersId = async ({ id }) => {
  const data = await request(`/users/${id}`);
  return { data };
};

const getUsersIdTransaction_accounts = async ({ id }) => {
  const data = await request(`/users/${id}/transaction_accounts`);
  return { data };
};

module.exports = { auth, getUsersId, getUsersIdTransaction_accounts };
