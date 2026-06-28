const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore, keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getSteps: () => request("/steps"),
  getReleases: () => request("/releases"),
  getRelease: (id) => request(`/releases/${id}`),
  createRelease: (data) =>
    request("/releases", { method: "POST", body: JSON.stringify(data) }),
  updateRelease: (id, data) =>
    request(`/releases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRelease: (id) => request(`/releases/${id}`, { method: "DELETE" }),
};
