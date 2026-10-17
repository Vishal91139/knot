import { apiFetch } from './client'

export function getMyOrganizer() {
  return apiFetch('/organizers/me')
}
