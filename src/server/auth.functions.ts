import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'
import {
  ADMIN_SESSION_COOKIE,
  checkAdminPassword,
  createAdminSessionCookieValue,
  isValidAdminSessionCookie,
} from './adminSession'

export const checkAdminSession = createServerFn({ method: 'GET' }).handler(async () => {
  return { authenticated: isValidAdminSessionCookie(getCookie(ADMIN_SESSION_COOKIE)) }
})

export const adminLogin = createServerFn({ method: 'POST' })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (!checkAdminPassword(data.password)) {
      throw new Error('Password salah.')
    }
    setCookie(ADMIN_SESSION_COOKIE, createAdminSessionCookieValue(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return { authenticated: true }
  })

export const adminLogout = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(ADMIN_SESSION_COOKIE, { path: '/' })
  return { authenticated: false }
})
