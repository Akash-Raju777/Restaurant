'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface CustomerGuardProps {
  children: React.ReactNode;
}

/**
 * CustomerGuard: renders children only when a customer session exists.
 * During the auth loading state, shows a spinner and renders nothing else
 * (no flash of protected content). Redirects to / if not authenticated.
 */
export function CustomerGuard({ children }: CustomerGuardProps) {
  const { customerSession, isLoading, requireCustomer } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!customerSession) {
      requireCustomer();
    }
  }, [isLoading, customerSession, requireCustomer]);

  // While loading, render a neutral skeleton so no protected content flashes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#D9A441] animate-spin" />
        <p className="mt-4 text-xs text-[#AAA39A]">Verifying session...</p>
      </div>
    );
  }

  // Not authenticated: the effect above already redirected, but render null as safety
  if (!customerSession) {
    return null;
  }

  return <>{children}</>;
}

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard: renders children only when an admin session exists.
 * During the auth loading state, shows a spinner and renders nothing else.
 * Redirects to / if not authenticated as admin.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { adminSession, isLoading, requireAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!adminSession) {
      requireAdmin();
    }
  }, [isLoading, adminSession, requireAdmin]);

  // While loading, render a neutral spinner so no protected admin content flashes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#FF9F43] animate-spin" />
        <p className="mt-4 text-xs text-[#AAA39A]">Verifying admin session...</p>
      </div>
    );
  }

  // Not authenticated as admin: effect above redirected; render null as safety
  if (!adminSession) {
    return null;
  }

  return <>{children}</>;
}
