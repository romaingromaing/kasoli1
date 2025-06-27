'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', ...props }, ref) => {
    const baseClasses = 'font-medium rounded-full transition-all duration-200 motion-ease disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-lime-lush text-ocean-navy hover:bg-lime-lush/90 active:bg-lime-lush/80',
      secondary: 'bg-teal-deep text-warm-white hover:bg-teal-deep/90 active:bg-teal-deep/80',
      outline: 'border-2 border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-warm-white',
      ghost: 'text-teal-deep hover:bg-teal-deep/10 active:bg-teal-deep/20',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg w-full h-14',
    };

    const { children, className = '', ...buttonProps } = props;

    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="inline-block"
      >
        <button
          ref={ref}
          className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
          disabled={loading || buttonProps.disabled}
          {...buttonProps}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            children
          )}
        </button>
      </motion.div>
    );
  }
);

Button.displayName = 'Button';