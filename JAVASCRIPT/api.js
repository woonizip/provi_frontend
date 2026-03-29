async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  // 토큰 있을 때만 넣기
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await res.json();
  }

  // 에러 처리
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      `HTTP ${res.status}`;

    throw new Error(message);
  }

  return data;
}