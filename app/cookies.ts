import { createCookie } from "@remix-run/node";

export const userCookie = createCookie('userId', {
  maxAge: 604_800, // one week
})