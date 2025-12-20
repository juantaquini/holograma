'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import styles from './ScrollSlider.module.css';

interface ScrollSliderProps {
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
}

const ScrollSlider: React.FC<ScrollSliderProps> = ({ 
  children, 
  direction = 'horizontal' 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbSize, setThumbSize] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const scroll = scrollRef.current;
    const thumb = thumbRef.current;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const updateThumbSize = () => {
      if (!scroll || !thumb) return;

      const ratio = direction === 'horizontal'
        ? scroll.clientWidth / scroll.scrollWidth
        : scroll.clientHeight / scroll.scrollHeight;

      const baseSize = direction === 'horizontal'
        ? scroll.clientWidth * ratio
        : scroll.clientHeight * ratio;

      const size = isMobile ? baseSize * 2.5 : baseSize;
      setThumbSize(size);
    };
    
    // Asegurar que el scroll comience desde el inicio en dispositivos móviles
    if (isMobile && direction === 'horizontal' && scroll) {
      scroll.scrollLeft = 0;
    }

    const updateThumbPosition = () => {
      if (!scroll || !thumb) return;

      const scrollRatio = direction === 'horizontal'
        ? scroll.scrollLeft / (scroll.scrollWidth - scroll.clientWidth)
        : scroll.scrollTop / (scroll.scrollHeight - scroll.clientHeight);

      const maxThumbPosition = direction === 'horizontal'
        ? scroll.clientWidth - thumb.offsetWidth
        : scroll.clientHeight - thumb.offsetHeight;

      thumb.style.transform = `translate${direction === 'horizontal' ? 'X' : 'Y'}(${scrollRatio * maxThumbPosition}px)`;
    };

    updateIsMobile();
    updateThumbSize();
    updateThumbPosition();

    scroll?.addEventListener('scroll', updateThumbPosition);
    
    const handleResize = () => {
      updateIsMobile();
      updateThumbSize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      scroll?.removeEventListener('scroll', updateThumbPosition);
      window.removeEventListener('resize', handleResize);
    };
  }, [direction, isMobile]);

  return (
    <div className={styles["scroll-wrapper"]}>
      <div className={`${styles["scroll-container"]} ${direction}`} ref={scrollRef}>
        {children}
      </div>
      <div
        className={`${styles["scroll-thumb"]} ${direction} ${isMobile ? 'mobile' : ''}`}
        ref={thumbRef}
        style={
          direction === 'horizontal'
            ? { width: thumbSize }
            : { height: thumbSize }
        }
      />
    </div>
  );
};

export default ScrollSlider;