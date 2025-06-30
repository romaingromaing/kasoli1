'use client';

import { BottomNav } from '@/components/ui/bottom-nav';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Settings, Users, Package, Truck, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function PlatformDashboard() {
  useRequireRole('PLATFORM');
  
  const platformFeatures = [
    {
      icon: Users,
      title: 'User Management',
      description: 'Monitor and manage all platform users',
      color: 'text-blue-600',
      href: '/platform/users'
    },
    {
      icon: Package,
      title: 'Deal Oversight',
      description: 'Track all active deals and transactions',
      color: 'text-green-600',
      href: '/platform/deals'
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Platform performance and metrics',
      color: 'text-purple-600',
      href: '/platform/analytics'
    },
    {
      icon: Settings,
      title: 'Platform Settings',
      description: 'Configure platform parameters',
      color: 'text-orange-600',
      href: '/platform/settings'
    }
  ];

  const roleAccess = [
    {
      icon: Package,
      title: 'Farmer View',
      description: 'Access farmer dashboard and features',
      color: 'text-green-600',
      role: 'FARMER'
    },
    {
      icon: ShoppingCart,
      title: 'Buyer View',
      description: 'Access buyer marketplace and orders',
      color: 'text-blue-600',
      role: 'BUYER'
    },
    {
      icon: Truck,
      title: 'Transporter View',
      description: 'Access transporter delivery features',
      color: 'text-orange-600',
      role: 'TRANSPORTER'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-white to-lime-lush/5 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-ocean-navy mb-2">Platform Dashboard</h1>
          <p className="text-dusk-gray mb-8">Manage the Kasoli grain trading platform and access all user roles</p>
        </motion.div>

        {/* Platform Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-ocean-navy mb-4">Platform Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gray-100 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ocean-navy mb-1">{feature.title}</h3>
                    <p className="text-sm text-dusk-gray mb-3">{feature.description}</p>
                    <Link href={feature.href}>
                      <Button variant="outline" size="sm">
                        Access
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Role Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-ocean-navy mb-4">Role Access</h2>
          <p className="text-dusk-gray mb-4">Switch to any user role to test and manage platform features</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleAccess.map((role, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gray-100 ${role.color}`}>
                    <role.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ocean-navy mb-1">{role.title}</h3>
                    <p className="text-sm text-dusk-gray mb-3">{role.description}</p>
                    <Link href={`/${role.role.toLowerCase()}`}>
                      <Button variant="outline" size="sm">
                        Switch to {role.role.charAt(0) + role.role.slice(1).toLowerCase()}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
