'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role, useRole } from './useRole';

export function useRequireRole(required: Role) {
  const { role, loading } = useRole();
  const router = useRouter();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  useEffect(() => {
    if (!loading && !hasCheckedRole) {
      setHasCheckedRole(true);
      // Only redirect if user has no role at all (not registered)
      // Allow users with different roles to access pages (they can switch roles)
      if (role === null) {
        router.push('/');
      }
    }
  }, [role, loading, hasCheckedRole, router]);

  return { role, loading, requiredRole: required };
}
