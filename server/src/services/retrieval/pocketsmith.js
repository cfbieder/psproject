const BASE_URL = "https://api.pocketsmith.com/v2";

let apiKey;

const auth = (key) => {
  apiKey = key;
};

const request = async (path, { includeHeaders = false } = {}) => {
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

  const data = text ? JSON.parse(text) : null;

  if (!includeHeaders) {
    return data;
  }

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return { data, headers };
};

const getUsersId = async ({ id }) => {
  const data = await request(`/users/${id}`);
  return { data };
};

const getUsersIdTransaction_accounts = async ({ id }) => {
  const data = await request(`/users/${id}/transaction_accounts`);
  return { data };
};

const getCategoriesId = async ({ id }) => {
  const data = await request(`/categories/${id}`);
  return { data };
};

const getUsersIdTransactions = async ({ id, updated_since, page }) => {
  const params = new URLSearchParams();
  if (updated_since) {
    params.set("updated_since", updated_since);
  }
  if (page) {
    params.set("page", page);
  }

  const query = params.toString();
  const { data, headers } = await request(
    `/users/${id}/transactions${query ? `?${query}` : ""}`,
    { includeHeaders: true }
  );
  return { data, headers };
};

module.exports = {
  auth,
  getUsersId,
  getUsersIdTransaction_accounts,
  getCategoriesId,
  getUsersIdTransactions,
};
