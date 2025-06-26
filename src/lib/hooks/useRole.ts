'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export type Role = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'PLATFORM' | null;

export function useRole(): { role: Role; loading: boolean } {
  const { address } = useAccount();
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!address) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/role?address=${address}`);
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [address]);

  return { role, loading };
}