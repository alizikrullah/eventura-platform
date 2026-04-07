const UNAUTHORIZED_EVENT = 'eventura:unauthorized'

export function dispatchUnauthorizedEvent() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export function subscribeToUnauthorizedEvent(handler: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener(UNAUTHORIZED_EVENT, handler)

  return () => {
    window.removeEventListener(UNAUTHORIZED_EVENT, handler)
  }
}