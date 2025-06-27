'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role, useRole } from './useRole';

export function useRequireRole(required: Role) {
  const { role, loading } = useRole();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (role === null) {
        router.push('/');
      } else if (role !== required) {
        router.push(`/${role.toLowerCase()}`);
      }
    }
  }, [role, loading, required, router]);

  return { role, loading, requiredRole: required };
}
