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
}: LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  }

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