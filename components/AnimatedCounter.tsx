'use client';
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: string;
}

export function AnimatedCounter({ value }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Check system setting for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Extract numeric parts (e.g. "12,000+" -> 12000, "100%" -> 100)
    const numericPart = value.replace(/[^0-9]/g, '');
    const number = parseInt(numericPart, 10);
    if (isNaN(number) || animated) {
      setDisplayValue(value);
      return;
    }

    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
          observer.unobserve(entry.target);

          // Counter animation setup
          let start = 0;
          const duration = 1500; // 1.5s animation duration
          const startTime = performance.now();

          const updateCounter = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad timing function
            const easeProgress = progress * (2 - progress);
            const currentCount = Math.floor(easeProgress * number);
            
            // Format number (add back comma formatting and appropriate suffix)
            let formatted = currentCount.toLocaleString();
            if (value.includes('+')) {
              formatted += '+';
            } else if (value.includes('%')) {
              formatted += '%';
            } else {
              const suffix = value.replace(/[0-9,]/g, '');
              formatted += suffix;
            }

            setDisplayValue(formatted);

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [value, animated]);

  return <span ref={ref}>{displayValue}</span>;
}
