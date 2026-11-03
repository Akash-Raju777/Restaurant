'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getCustomerSession,
  getAdminSession,
  setCustomerSession,
  setAdminSession,
  clearCustomerSession,
  clearAdminSession,
  clearSession,
  UserSession,
  CUSTOMER_AUTH_EVENT,
  ADMIN_AUTH_EVENT,
} from '@/lib/api';

interface AuthContextType {
  customerSession: UserSession | null;
  adminSession: UserSession | null;
  session: UserSession | null;
  isLoading: boolean;
  loginCustomer: (session: UserSession) => void;
  loginAdmin: (session: UserSession) => void;
  logoutCustomer: () => void;
  logoutAdmin: () => void;
  logoutAll: () => void;
  requireCustomer: () => void;
  requireAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readSessions() {
  const customer = getCustomerSession();
  const admin = getAdminSession();
  return { customer, admin };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [customerSession, setCustomerSessionState] = useState<UserSession | null>(null);
  const [adminSession, setAdminSessionState] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const initAuth = () => {
      if (cancelled) return;
      const { customer, admin } = readSessions();
      setCustomerSessionState(customer);
      setAdminSessionState(admin);
      setIsLoading(false);
    };
    initAuth();

    const handleCustomerAuth = () => {
      if (cancelled) return;
      setCustomerSessionState(getCustomerSession());
    };
    const handleAdminAuth = () => {
      if (cancelled) return;
      setAdminSessionState(getAdminSession());
    };

    window.addEventListener(CUSTOMER_AUTH_EVENT, handleCustomerAuth);
    window.addEventListener(ADMIN_AUTH_EVENT, handleAdminAuth);
    return () => {
      cancelled = true;
      window.removeEventListener(CUSTOMER_AUTH_EVENT, handleCustomerAuth);
      window.removeEventListener(ADMIN_AUTH_EVENT, handleAdminAuth);
    };
  }, []);

  // Sync pathname-based session when navigating between admin/customer areas
  useEffect(() => {
    const { customer, admin } = readSessions();
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    if (isAdminRoute && admin && !adminSession) {
      setAdminSessionState(admin);
    }
    if (!isAdminRoute && customer && !customerSession) {
      setCustomerSessionState(customer);
    }
  }, [pathname, adminSession, customerSession]);

  const loginCustomer = useCallback(
    (session: UserSession) => {
      setCustomerSession(session);
      setCustomerSessionState(session);
      setAdminSessionState(null);
      setIsLoading(false);
    },
    []
  );

  const loginAdmin = useCallback(
    (session: UserSession) => {
      setAdminSession(session);
      setAdminSessionState(session);
      setCustomerSessionState(null);
      setIsLoading(false);
    },
    []
  );

  const logoutCustomer = useCallback(() => {
    clearCustomerSession();
    setCustomerSessionState(null);
    setIsLoading(false);
  }, []);

  const logoutAdmin = useCallback(() => {
    clearAdminSession();
    setAdminSessionState(null);
    setIsLoading(false);
  }, []);

  const logoutAll = useCallback(() => {
    clearSession();
    setCustomerSessionState(null);
    setAdminSessionState(null);
    setIsLoading(false);
  }, []);

  const requireCustomer = useCallback(() => {
    if (!customerSession) {
      router.push('/');
    }
  }, [customerSession, router]);

  const requireAdmin = useCallback(() => {
    if (!adminSession) {
      router.push('/');
    }
  }, [adminSession, router]);

  const value: AuthContextType = {
    customerSession,
    adminSession,
    session: customerSession || adminSession,
    isLoading,
    loginCustomer,
    loginAdmin,
    logoutCustomer,
    logoutAdmin,
    logoutAll,
    requireCustomer,
    requireAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
