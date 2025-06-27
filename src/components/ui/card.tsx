'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = true, className = '', ...props }, ref) => {
    // Separate HTML div props from motion props to avoid conflicts
    const {
      onAnimationStart,
      onAnimationEnd,
      onDrag,
      onDragStart,
      onDragEnd,
      ...divProps
    } = props;
    
    return (
      <motion.div
        ref={ref}
        className={`bg-warm-white rounded-2xl shadow-sm border border-dusk-gray/10 p-6 ${className}`}
        whileHover={hover ? { y: -2, boxShadow: '0 8px 25px rgba(30, 82, 135, 0.1)' } : undefined}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        {...divProps}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';