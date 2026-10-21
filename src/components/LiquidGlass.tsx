import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface LiquidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: 'cyan' | 'purple' | 'pink' | 'emerald' | 'none';
}

export function LiquidCard({
  children,
  className = '',
  elevated = false,
  glow = 'none',
  ...props
}: LiquidCardProps) {
  const glowStyles = {
    cyan: 'shadow-[0_12px_40px_rgba(6,182,212,0.18)] border-cyan-400/30',
    purple: 'shadow-[0_12px_40px_rgba(168,85,247,0.18)] border-purple-400/30',
    pink: 'shadow-[0_12px_40px_rgba(244,63,94,0.18)] border-pink-400/30',
    emerald: 'shadow-[0_12px_40px_rgba(16,185,129,0.18)] border-emerald-400/30',
    none: '',
  };

  return (
    <div
      className={`
        ${elevated ? 'liquid-glass-elevated' : 'liquid-glass'}
        rounded-[28px]
        p-5 sm:p-6
        transition-all duration-300
        liquid-specular-shine
        ${glowStyles[glow]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface LiquidButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function LiquidButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  isLoading = false,
  disabled,
  ...props
}: LiquidButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-xs font-semibold tracking-wide',
    md: 'px-5 py-3 text-sm font-semibold tracking-wide',
    lg: 'px-6 py-3.5 text-base font-bold tracking-wide',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-cyan-500/80 via-blue-600/80 to-indigo-600/80
      text-white
      border border-cyan-300/40
      shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),0_8px_24px_rgba(6,182,212,0.35)]
      hover:shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.8),0_12px_32px_rgba(6,182,212,0.5)]
    `,
    secondary: `
      bg-white/10
      text-slate-100
      border border-white/20
      shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.25)]
      hover:bg-white/15
    `,
    success: `
      bg-gradient-to-r from-emerald-500/80 to-teal-600/80
      text-white
      border border-emerald-300/40
      shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.6),0_8px_24px_rgba(16,185,129,0.35)]
    `,
    danger: `
      bg-gradient-to-r from-rose-600/80 to-red-700/80
      text-white
      border border-rose-300/40
      shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.5),0_8px_24px_rgba(225,29,72,0.35)]
    `,
    ghost: `
      bg-transparent
      text-slate-300
      border border-transparent
      hover:bg-white/10
      hover:text-white
    `,
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      whileHover={{ y: disabled || isLoading ? 0 : -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled || isLoading}
      className={`
        liquid-specular-shine
        rounded-full
        backdrop-blur-xl
        inline-flex items-center justify-center gap-2
        cursor-pointer
        select-none
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function LiquidInput({ label, error, icon, className = '', ...props }: LiquidInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-medium text-slate-300 tracking-wide ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full
            bg-white/10
            dark:bg-slate-900/40
            backdrop-blur-2xl
            border border-white/20
            focus:border-cyan-400/80
            focus:outline-none
            focus:ring-2 focus:ring-cyan-500/20
            text-white
            placeholder-slate-400
            text-sm
            rounded-2xl
            px-4 py-3
            ${icon ? 'pl-11' : ''}
            transition-all duration-200
            shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.25)]
            ${error ? 'border-rose-500/80 focus:border-rose-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-400 ml-1">{error}</span>}
    </div>
  );
}
