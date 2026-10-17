import { apiFetch } from './client'

export function listEvents(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })

  const suffix = search.toString() ? `?${search.toString()}` : ''
  return apiFetch(`/events${suffix}`)
}

export function getEventById(eventId) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}`)
}

export function createEvent(payload) {
  return apiFetch('/events', { method: 'POST', body: payload })
}

export function updateEvent(eventId, payload) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: payload })
}

export function deleteEvent(eventId) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' })
}

export function setEventStatus(eventId, status, rejectionReason) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}/status`, {
    method: 'PATCH',
    body: {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    },
  })
}

export function setEventFeaturedState(eventId, isFeatured) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}/feature`, {
    method: 'PATCH',
    body: { isFeatured },
  })
}

export function registerForEvent(eventId) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}/register`, { method: 'POST' })
}

export function unregisterFromEvent(eventId) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}/register`, { method: 'DELETE' })
}

export function getMyEventRegistration(eventId) {
  return apiFetch(`/events/${encodeURIComponent(eventId)}/registration`)
}
