'use client';

import { motion } from 'framer-motion';
import { Home, Package, Truck, ShoppingCart, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/hooks/useRole';

const navItems = {
  FARMER: [
    { icon: Home, label: 'Dashboard', href: '/farmer' },
    { icon: Package, label: 'Batches', href: '/farmer/batches' },
    { icon: Settings, label: 'Profile', href: '/farmer/profile' },
  ],
  BUYER: [
    { icon: Home, label: 'Market', href: '/buyer' },
    { icon: ShoppingCart, label: 'Orders', href: '/buyer/orders' },
    { icon: Settings, label: 'Profile', href: '/buyer/profile' },
  ],
  TRANSPORTER: [
    { icon: Home, label: 'Dashboard', href: '/transporter' },
    { icon: Truck, label: 'Deliveries', href: '/transporter/deliveries' },
    { icon: Package, label: 'Deals', href: '/transporter/deals' },
    { icon: Settings, label: 'Profile', href: '/transporter/profile' },
  ],
  PLATFORM: [
    { icon: Home, label: 'Dashboard', href: '/platform' },
    { icon: Package, label: 'Deals', href: '/platform/deals' },
    { icon: Settings, label: 'Settings', href: '/platform/settings' },
  ],
};

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useRole();

  if (!role) return null;

  const items = navItems[role] || [];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-warm-white border-t border-dusk-gray/20 px-4 py-2 z-50"
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-ocean-navy bg-lime-lush/20' 
                    : 'text-dusk-gray hover:text-teal-deep'
                }`}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 w-8 h-1 bg-lime-lush rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}