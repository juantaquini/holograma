'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import styles from './ScrollSlider.module.css';

interface ScrollSliderProps {
  children: ReactNode;
  direction?: 'horizontal' | 'vertical';
  disableDrag?: boolean;
  disableWheel?: boolean;
}

const ScrollSlider: React.FC<ScrollSliderProps> = ({ 
  children, 
  direction = 'horizontal',
  disableDrag = false,
  disableWheel = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbSize, setThumbSize] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const lastXRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);

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

    const onWheel = (e: WheelEvent) => {
      if (!scroll || disableWheel) return;
      if (direction === 'horizontal') {
        const max = scroll.scrollWidth - scroll.clientWidth;
        if (max <= 0) return;
        const atStart = scroll.scrollLeft <= 0;
        const atEnd = scroll.scrollLeft >= max;
        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;
        if ((atStart && scrollingUp) || (atEnd && scrollingDown)) {
          return;
        }
        e.preventDefault();
        scroll.scrollLeft += e.deltaY;
      }
    };
    if (!disableWheel) {
      scroll?.addEventListener('wheel', onWheel, { passive: false });
    }
    
    const handleResize = () => {
      updateIsMobile();
      updateThumbSize();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      scroll?.removeEventListener('scroll', updateThumbPosition);
      scroll?.removeEventListener('wheel', onWheel as any);
      window.removeEventListener('resize', handleResize);
    };
  }, [direction, isMobile]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disableDrag || !scrollRef.current) return;
    setDragging(true);
    lastXRef.current = e.clientX;
    lastYRef.current = e.clientY;
    try { scrollRef.current.setPointerCapture(e.pointerId); } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disableDrag || !scrollRef.current || !dragging) return;
    if (direction === 'horizontal') {
      const lastX = lastXRef.current ?? e.clientX;
      const deltaX = e.clientX - lastX;
      const max = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      const prev = scrollRef.current.scrollLeft;
      const next = Math.min(max, Math.max(0, prev - deltaX));
      scrollRef.current.scrollLeft = next;
      lastXRef.current = e.clientX;
      if (!(next === 0 && deltaX < 0) && !(next === max && deltaX > 0)) {
        e.preventDefault();
      }
    } else {
      const lastY = lastYRef.current ?? e.clientY;
      const deltaY = e.clientY - lastY;
      const maxY = scrollRef.current.scrollHeight - scrollRef.current.clientHeight;
      const prevY = scrollRef.current.scrollTop;
      const nextY = Math.min(maxY, Math.max(0, prevY - deltaY));
      scrollRef.current.scrollTop = nextY;
      lastYRef.current = e.clientY;
      if (!(nextY === 0 && deltaY < 0) && !(nextY === maxY && deltaY > 0)) {
        e.preventDefault();
      }
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disableDrag) return;
    setDragging(false);
    lastXRef.current = null;
    lastYRef.current = null;
    try { scrollRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div className={styles["scroll-wrapper"]}>
      <div
        className={`${styles["scroll-container"]} ${direction}`}
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        style={{ cursor: disableDrag ? undefined : (dragging ? 'grabbing' : 'grab') }}
      >
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