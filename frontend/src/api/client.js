export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function joinUrl(base, path) {
  const baseClean = String(base || '').replace(/\/+$/, '')
  const pathClean = String(path || '').replace(/^\/+/, '')
  if (!baseClean) return `/${pathClean}`
  return `${baseClean}/${pathClean}`
}

export async function apiFetch(path, options = {}) {
  const baseUrl = import.meta.env.VITE_API_URL
  const url = joinUrl(baseUrl, path)

  const {
    method = 'GET',
    body,
    headers,
    credentials = 'include',
    signal,
  } = options

  const init = {
    method,
    credentials,
    signal,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  }

  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error?.message ||
      payload?.error ||
      `Request failed (${response.status})`

    throw new ApiError(message, response.status, payload)
  }

  return payload
}
