import React, { Component } from 'react';
import { motion } from 'framer-motion';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}
export function Card({
  children,
  className = '',
  hover = false,
  onClick
}: CardProps) {
  const baseStyles =
  'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden';
  const hoverStyles = hover ?
  'hover:shadow-xl transition-shadow duration-300 cursor-pointer' :
  '';
  const CardComponent = hover || onClick ? motion.div : 'div';
  const motionProps =
  hover || onClick ?
  {
    whileHover: {
      y: -5
    },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  } :
  {};
  return (
    <CardComponent
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...(motionProps as any)}>
      
      {children}
    </CardComponent>);

}