import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`${hover ? 'card-hover' : 'card'} p-6 ${className}`}>
      {children}
    </div>
  );
}
