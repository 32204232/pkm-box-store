const ACCESS_TOKEN_KEY = "pkm_access_token";
const AUTH_CHANGED_EVENT = "pkm-auth-changed";

type TokenPayload = {
  role?: string;
  exp?: number;
  sub?: string;
  [key: string]: unknown;
};

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyAuthChanged();
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  notifyAuthChanged();
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}

export function getTokenPayload(): TokenPayload | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as TokenPayload;
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  const role = getTokenPayload()?.role;
  if (role === "ROLE_MEMBER" || role === "ROLE_ADMIN") {
    return role;
  }
  return null;
}

export function getCurrentEmail() {
  const subject = getTokenPayload()?.sub;
  return typeof subject === "string" ? subject : null;
}

export function onAuthChanged(listener: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
