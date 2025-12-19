const USER_STORAGE_KEY = "user"

export const storage = {
  getUser: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(USER_STORAGE_KEY)
  },

  setUser: (user: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(USER_STORAGE_KEY, user)
  },

  removeUser: (): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(USER_STORAGE_KEY)
  },
}
