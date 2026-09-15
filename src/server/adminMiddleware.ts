import { createMiddleware } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { ADMIN_SESSION_COOKIE, isValidAdminSessionCookie } from './adminSession'

// Attach to every server function that reads/writes admin-only data
// (listCards, updateCard, deactivateCard, generateCards). This is the real
// data boundary — the `/admin` route's `beforeLoad` redirect is just UX,
// since server functions are callable directly regardless of which page
// requested them.
export const requireAdmin = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const value = getCookie(ADMIN_SESSION_COOKIE)
  if (!isValidAdminSessionCookie(value)) {
    throw new Error('Unauthorized — silakan login sebagai admin terlebih dahulu.')
  }
  return next()
})
