import type { User } from "./types"

export function isValidUser(obj: Record<string, unknown>): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.name === "string" &&
    typeof obj.email === "string" &&
    typeof obj.role === "string" &&
    (obj.role === "admin" || obj.role === "user")
  )
}

export function parseUser(userString: string): User | null {
  try {
    const parsed = JSON.parse(userString)
    if (isValidUser(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}
