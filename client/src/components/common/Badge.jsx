import React from 'react';

const BADGE_VARIANTS = {
  verified: 'bg-emerald-300 text-black border-black',
  unverified: 'bg-rose-300 text-black border-black',
  conflict: 'bg-amber-300 text-black border-black',
  ambiguous: 'bg-purple-200 text-black border-black',
  unassigned: 'bg-orange-200 text-black border-black',
  no_deadline: 'bg-yellow-200 text-black border-black',
  pending: 'bg-amber-100 text-black border-black',
  in_progress: 'bg-sky-200 text-black border-black',
  done: 'bg-emerald-200 text-black border-black',
  cancelled: 'bg-gray-200 text-black border-black',
  high: 'bg-rose-400 text-black border-black',
  medium: 'bg-amber-300 text-black border-black',
  low: 'bg-emerald-200 text-black border-black',
  default: 'bg-white text-black border-black',
  primary: 'bg-neo-yellow text-black border-black',
  dark: 'bg-black text-white border-black'
};

export const Badge = ({
  variant = 'default',
  children,
  className = '',
  size = 'md',
  onClick
}) => {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-bold',
    md: 'px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
    lg: 'px-3 py-1.5 text-sm font-black uppercase tracking-wider'
  };

  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-2 rounded-md shadow-neo-sm transition-transform select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClass} ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0' : ''} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
