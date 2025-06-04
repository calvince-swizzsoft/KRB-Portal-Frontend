export async function authorizedFetch(endpoint, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  let accessToken = sessionStorage.getItem("token");
  const refreshToken = sessionStorage.getItem("refresh");

  // Build full URL
  const url = `${baseUrl}${endpoint}`;

  // Set headers
  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // First attempt
  let response = await fetch(url, options);

  // Handle expired access token
  if (response.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${baseUrl}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!refreshRes.ok) throw new Error("Refresh failed");

      const refreshData = await refreshRes.json();
      accessToken = refreshData.access;
      sessionStorage.setItem("token", accessToken);

      // Retry original request with new token
      options.headers["Authorization"] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
    } catch (err) {
      console.error("Token refresh failed:", err);
      sessionStorage.clear();
      window.location.href = "/login"; // or use navigate()
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
}