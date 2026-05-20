import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({
  href,
  children,
  className = '',
  onClick,
  ...props
}: LinkProps) {
  return (
    <RouterLink
      to={href}
      className={className}
      onClick={onClick}
      {...props as any}>
      {children}
    </RouterLink>
  );
}