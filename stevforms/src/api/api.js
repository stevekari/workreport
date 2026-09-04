const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8080/api" : "/api");

function getToken() {
  return sessionStorage.getItem("sf_token");
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    throw new Error(
      `Cannot connect to server at ${BASE_URL}. Is the backend running? (${netErr.message})`,
      { cause: netErr },
    );
  }

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || json.error || text;
        } catch {
          errorMsg = text;
        }
      }
    } catch {
      /* ignore */
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  registerCompany: (data) =>
    request("/auth/register-company", { method: "POST", body: data }),
  registerEmployee: (data) =>
    request("/auth/register-employee", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  updateProfile: (data) =>
    request("/auth/profile", { method: "PUT", body: data }),
  getMe: () => request("/auth/me"),

  listWorkers: () => request("/workers"),
  addWorker: (data) => request("/workers", { method: "POST", body: data }),
  updateWorker: (id, data) =>
    request(`/workers/${id}`, { method: "PUT", body: data }),
  deleteWorker: (id) => request(`/workers/${id}`, { method: "DELETE" }),

  listEntries: () => request("/entries"),
  addEntry: (data) => request("/entries", { method: "POST", body: data }),
  updateEntry: (id, data) =>
    request(`/entries/${id}`, { method: "PUT", body: data }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: "DELETE" }),

  listProducts: () => request("/products"),
  addProduct: (code) =>
    request("/products", { method: "POST", body: { code } }),

  listMessages: () => request("/messages"),
  sendMessage: (data) =>
    request("/messages", { method: "POST", body: data }),
  toggleLikeMessage: (id) =>
    request(`/messages/${id}/like`, { method: "POST" }),
  addMessageComment: (id, text) =>
    request(`/messages/${id}/comments`, { method: "POST", body: { text } }),
  updateMessageStatus: (id, data) =>
    request(`/messages/${id}/status`, { method: "PUT", body: data }),
  deleteMessage: (id) => request(`/messages/${id}`, { method: "DELETE" }),
};

export function saveSession(auth) {
  sessionStorage.setItem("sf_token", auth.token);
  sessionStorage.setItem("sf_user", JSON.stringify(auth));
}

export function loadSession() {
  const raw = sessionStorage.getItem("sf_user");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  try {
    sessionStorage.removeItem("sf_token");
    sessionStorage.removeItem("sf_user");
    sessionStorage.clear();
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
  } catch {
    /* ignore */
  }
}
