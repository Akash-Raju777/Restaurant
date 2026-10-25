// frontend/lib/api.ts
// Universal API client for The Ember restaurant platform

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface UserSession {
  token: string;
  id: number;
  email: string;
  fullName: string;
  role: 'ROLE_ADMIN' | 'ROLE_CUSTOMER';
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('ember_session');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setSession(session: UserSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ember_session', JSON.stringify(session));
    document.cookie = `ember_token=${session.token}; path=/; max-age=86400; SameSite=Lax`;
    window.dispatchEvent(new Event('ember_auth_change'));
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ember_session');
    localStorage.removeItem('ember_cart');
    document.cookie = 'ember_token=; path=/; max-age=0; SameSite=Lax';
    window.dispatchEvent(new Event('ember_auth_change'));
  }
}

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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}
