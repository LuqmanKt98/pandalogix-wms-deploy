export const storage = {
  get: (key: string) => {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: unknown) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}
