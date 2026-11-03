// frontend/lib/api.ts
// Universal API client for The Ember restaurant platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

export interface UserSession {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER';
  phoneNumber?: string;
}

/* ------------------------------------------------------------------ */
/*  Role-separated session storage                                    */
/*  Customer uses ember_session_customer / ember_token_customer       */
/*  Admin    uses ember_session_admin    / ember_token_admin          */
/*  This prevents one tab's login from overwriting another tab's      */
/*  session when Admin and Customer are open simultaneously.          */
/* ------------------------------------------------------------------ */

const CUSTOMER_STORAGE_KEY = 'ember_session_customer';
const ADMIN_STORAGE_KEY = 'ember_session_admin';
const CUSTOMER_COOKIE_NAME = 'ember_token_customer';
const ADMIN_COOKIE_NAME = 'ember_token_admin';
export const CUSTOMER_AUTH_EVENT = 'ember_auth_change_customer';
export const ADMIN_AUTH_EVENT = 'ember_auth_change_admin';

function storageKeyFor(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER') {
  return role === 'ROLE_ADMIN' ? ADMIN_STORAGE_KEY : CUSTOMER_STORAGE_KEY;
}

function cookieNameFor(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER') {
  return role === 'ROLE_ADMIN' ? ADMIN_COOKIE_NAME : CUSTOMER_COOKIE_NAME;
}

function authEventFor(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER') {
  return role === 'ROLE_ADMIN' ? ADMIN_AUTH_EVENT : CUSTOMER_AUTH_EVENT;
}

/** Read a session from localStorage by role */
export function getSessionByRole(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER'): UserSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(storageKeyFor(role));
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as UserSession;
    if (parsed.role !== role) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Read the customer session */
export function getCustomerSession(): UserSession | null {
  return getSessionByRole('ROLE_CUSTOMER');
}

/** Read the admin session */
export function getAdminSession(): UserSession | null {
  return getSessionByRole('ROLE_ADMIN');
}

/** Read the session matching the current pathname context */
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const admin = getAdminSession();
  const customer = getCustomerSession();
  // Prefer the session whose role matches the current route, else return whichever exists
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return admin || customer;
  }
  return customer || admin;
}

/** Persist a session for a given role (localStorage + cookie + cross-tab event) */
export function setSessionByRole(session: UserSession): void {
  if (typeof window === 'undefined') return;
  const key = storageKeyFor(session.role);
  const cookie = cookieNameFor(session.role);
  const event = authEventFor(session.role);
  localStorage.setItem(key, JSON.stringify(session));
  document.cookie = `${cookie}=${session.token}; path=/; max-age=86400; SameSite=Lax`;
  window.dispatchEvent(new Event(event));
}

/** Persist the customer session */
export function setCustomerSession(session: UserSession): void {
  setSessionByRole({ ...session, role: 'ROLE_CUSTOMER' });
}

/** Persist the admin session */
export function setAdminSession(session: UserSession): void {
  setSessionByRole({ ...session, role: 'ROLE_ADMIN' });
}

/** Backward-compatible setter: infers role from the session object */
export function setSession(session: UserSession): void {
  setSessionByRole(session);
}

/** Clear a session for a given role */
export function clearSessionByRole(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER'): void {
  if (typeof window === 'undefined') return;
  const key = storageKeyFor(role);
  const cookie = cookieNameFor(role);
  const event = authEventFor(role);
  localStorage.removeItem(key);
  document.cookie = `${cookie}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(event));
}

/** Clear the customer session */
export function clearCustomerSession(): void {
  clearSessionByRole('ROLE_CUSTOMER');
}

/** Clear the admin session */
export function clearAdminSession(): void {
  clearSessionByRole('ROLE_ADMIN');
}

/** Backward-compatible clearer: clears both customer and admin sessions */
export function clearSession(): void {
  clearCustomerSession();
  clearAdminSession();
}

/** Check whether a valid session exists for the given role */
export function hasSession(role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER'): boolean {
  return getSessionByRole(role) !== null;
}

/** Check whether the user is authenticated as a customer */
export function isCustomerAuthenticated(): boolean {
  return hasSession('ROLE_CUSTOMER');
}

/** Check whether the user is authenticated as an admin */
export function isAdminAuthenticated(): boolean {
  return hasSession('ROLE_ADMIN');
}

/* ------------------------------------------------------------------ */
/*  API request helper                                                */
/* ------------------------------------------------------------------ */

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle authentication/authorization failures: clear the relevant session
  // and throw so the page can redirect to login.
  if (res.status === 401 || res.status === 403) {
    try {
      // Determine which session to clear based on the endpoint
      if (endpoint.startsWith('/admin')) {
        clearAdminSession();
      } else {
        clearCustomerSession();
      }
    } catch {}
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message ||
      (res.status === 401 ? 'Session expired. Please log in again.' : 'Access denied. Please log in again.')
    );
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function apiDownload(
  endpoint: string,
  fallbackFilename = 'download'
): Promise<{ blob: Blob; filename: string }> {
  const session = getSession();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Download failed with status ${res.status}`);
  }

  const disposition = res.headers.get('Content-Disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = utf8Match
    ? decodeURIComponent(utf8Match[1])
    : plainMatch?.[1] || fallbackFilename;

  return { blob: await res.blob(), filename };
}

export async function apiUpload<T>(endpoint: string, file: File, fieldName = 'file'): Promise<T> {
  const session = getSession();
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

/* ---------- Saved Addresses ---------- */

export interface Address {
  id?: number;
  houseDetails: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string;
  recipientName?: string;
  recipientPhone?: string;
  addressType?: string; // HOME, WORK, OTHER
  isDefault?: boolean;
  createdAt?: string;
}

export async function fetchAddresses(): Promise<Address[]> {
  return apiRequest<Address[]>('/customer/addresses');
}

export async function addAddress(address: Address): Promise<Address> {
  return apiRequest<Address>('/customer/addresses', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

export async function updateAddress(id: number, address: Address): Promise<Address> {
  try {
    return await apiRequest<Address>(`/customer/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address),
    });
  } catch (err: any) {
    const isMethodNotAllowed =
      err?.message?.includes('Method Not Allowed') ||
      err?.message?.includes('405') ||
      err?.message?.includes('Request method');

    if (isMethodNotAllowed) {
      try {
        return await apiRequest<Address>(`/customer/addresses/${id}`, {
          method: 'POST',
          body: JSON.stringify(address),
        });
      } catch {
        const newAddr = await addAddress(address);
        if (id && id !== newAddr.id) {
          try {
            await deleteAddressApi(id);
          } catch {}
        }
        return newAddr;
      }
    }
    throw err;
  }
}

export async function deleteAddressApi(id: number): Promise<void> {
  await apiRequest<void>(`/customer/addresses/${id}`, { method: 'DELETE' });
}

export async function setDefaultAddress(id: number): Promise<Address> {
  return apiRequest<Address>(`/customer/addresses/${id}/default`, {
    method: 'PATCH',
  });
}
