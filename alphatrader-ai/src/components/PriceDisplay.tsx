"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  change?: number;
  changePercent?: number;
  direction?: 'up' | 'down' | 'neutral';
  showChange?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({
  price,
  change = 0,
  changePercent = 0,
  direction = 'neutral',
  showChange = true,
  className = '',
  size = 'md',
}: PriceDisplayProps) {
  const [flash, setFlash] = useState(false);

  // Trigger flash animation when direction changes
  useEffect(() => {
    if (direction !== 'neutral') {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [direction, price]);

  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const flashColor = direction === 'up'
    ? 'animate-flash-green'
    : direction === 'down'
    ? 'animate-flash-red'
    : '';

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`font-medium ${sizeClasses[size]} ${flash ? flashColor : ''} transition-all duration-300`}
      >
        ${price.toFixed(2)}
      </span>

      {showChange && (
        <div className={`flex items-center gap-1 ${changeColor} ${sizeClasses[size]}`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function PriceChangeIndicator({
  change,
  changePercent,
  className = '',
}: {
  change: number;
  changePercent: number;
  className?: string;
}) {
  const isPositive = change >= 0;
  const color = isPositive ? 'text-green-500' : 'text-red-500';
  const bgColor = isPositive ? 'bg-green-900/20' : 'bg-red-900/20';

  return (
    <div className={`flex items-center gap-1 ${color} ${className}`}>
      {isPositive ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      <div className={`px-2 py-1 rounded ${bgColor}`}>
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
