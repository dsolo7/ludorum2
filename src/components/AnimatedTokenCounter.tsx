import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface AnimatedTokenCounterProps {
  startValue: number;
  endValue: number;
  duration?: number;
  isAnimating?: boolean;
  showChange?: boolean;
}

const AnimatedTokenCounter: React.FC<AnimatedTokenCounterProps> = ({
  startValue,
  endValue,
  duration = 1000,
  isAnimating = false,
  showChange = true
}) => {
  const [currentValue, setCurrentValue] = useState(startValue);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isAnimating) {
      setCurrentValue(endValue);
      return;
    }

    setIsComplete(false);
    const startTime = Date.now();
    const difference = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const newValue = Math.round(startValue + (difference * easeOutCubic));
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
      }
    };

    requestAnimationFrame(animate);
  }, [startValue, endValue, duration, isAnimating]);

  const change = endValue - startValue;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <Coins className={`h-5 w-5 mr-1 transition-colors duration-300 ${
          isAnimating 
            ? 'text-yellow-400 animate-pulse' 
            : 'text-yellow-500'
        }`} />
        <span className={`text-lg font-bold transition-all duration-300 ${
          isAnimating 
            ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {currentValue.toLocaleString()}
        </span>
      </div>
      
      {showChange && change !== 0 && isComplete && (
        <span className={`text-sm font-medium px-2 py-1 rounded-full transition-all duration-500 transform ${
          isPositive 
            ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 scale-100' 
            : isNegative
            ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 scale-100'
            : 'scale-0'
        }`}>
          {isPositive ? '+' : ''}{change}
        </span>
      )}
    </div>
  );
};

export default AnimatedTokenCounter;