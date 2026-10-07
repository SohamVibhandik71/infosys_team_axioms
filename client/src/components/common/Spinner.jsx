import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-10 h-10 border-4',
    xl: 'w-16 h-16 border-4'
  };

  return (
    <div
      className={`inline-block rounded-full border-black border-t-neo-yellow animate-spin ${
        sizeMap[size] || sizeMap.md
      } ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
