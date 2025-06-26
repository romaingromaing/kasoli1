'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Role, useRole } from '@/lib/hooks/useRole';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const { role } = useRole();
  const router = useRouter();

  const switchRole = async (r: Role) => {
    if (!address || !r) return;
    await fetch('/api/user/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, role: r }),
    });
    setOpen(false);
    router.push(`/${r.toLowerCase()}`);
  };

  if (!address) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-ocean-navy text-warm-white p-3 rounded-full shadow-lg z-50"
      >
        Switch Role
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Switch Role">
        <div className="space-y-3">
          {(['FARMER', 'BUYER', 'TRANSPORTER'] as Role[]).map((r) => (
            <Button
              key={r}
              variant={role === r ? 'secondary' : 'primary'}
              onClick={() => switchRole(r)}
              className="w-full"
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  );
}
