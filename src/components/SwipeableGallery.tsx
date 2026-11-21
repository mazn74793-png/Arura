import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import { cn } from '../lib/utils';

interface SwipeableGalleryProps {
  images: string[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  alt: string;
  className?: string;
  imageClassName?: string;
  showIndicators?: boolean;
  indicatorPosition?: 'bottom' | 'top';
  onImageClick?: (index: number) => void;
  children?: React.ReactNode;
}

export default function SwipeableGallery({
  images,
  activeIndex,
  onChangeIndex,
  alt,
  className,
  imageClassName,
  showIndicators = true,
  indicatorPosition = 'bottom',
  onImageClick,
  children,
}: SwipeableGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const gestureRef = useRef<{
    isDown: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    lockedAxis: 'x' | 'y' | null;
    hasMoved: boolean;
  }>({
    isDown: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lockedAxis: null,
    hasMoved: false,
  });

  const suppressClickRef = useRef(false);

  const safeIndex = Math.max(0, Math.min(activeIndex, Math.max(0, images.length - 1)));
  const canSwipe = images.length > 1;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;

    gestureRef.current = {
      isDown: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      lockedAxis: null,
      hasMoved: false,
    };
    suppressClickRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g.isDown || !canSwipe) return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.lockedAxis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;

      if (Math.abs(dx) >= Math.abs(dy)) {
        g.lockedAxis = 'x';
        g.hasMoved = true;
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture errors on synthetic events
        }
      } else {
        g.lockedAxis = 'y';
        g.hasMoved = true;
        return;
      }
    }

    if (g.lockedAxis === 'x') {
      if ((safeIndex === 0 && dx > 0) || (safeIndex === images.length - 1 && dx < 0)) {
        setDragOffset(dx * 0.25);
      } else {
        setDragOffset(dx);
      }
    }
  };

  const finishGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g.isDown) return;

    if (g.pointerId !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(g.pointerId)) {
          e.currentTarget.releasePointerCapture(g.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    }

    if (g.lockedAxis === 'x' && canSwipe) {
      const dx = e.clientX - g.startX;
      const dt = Math.max(1, performance.now() - g.startTime);
      const velocity = dx / dt;
      const width = containerRef.current?.offsetWidth || 300;
      const threshold = Math.min(60, width * 0.16);

      if ((dx < -threshold || velocity < -0.35) && safeIndex < images.length - 1) {
        onChangeIndex(safeIndex + 1);
      } else if ((dx > threshold || velocity > 0.35) && safeIndex > 0) {
        onChangeIndex(safeIndex - 1);
      }

      if (g.hasMoved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 80);
      }
    }

    gestureRef.current.isDown = false;
    gestureRef.current.lockedAxis = null;
    gestureRef.current.pointerId = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      return;
    }

    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;

    if (onImageClick && !gestureRef.current.hasMoved) {
      onImageClick(safeIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    if (e.key === 'ArrowRight' && safeIndex < images.length - 1) {
      onChangeIndex(safeIndex + 1);
    } else if (e.key === 'ArrowLeft' && safeIndex > 0) {
      onChangeIndex(safeIndex - 1);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={canSwipe ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      onClick={handleClick}
      style={{ touchAction: canSwipe ? 'pan-y' : 'auto' }}
      className={cn(
        'relative overflow-hidden select-none outline-none focus-visible:ring-1 focus-visible:ring-white/40 bg-neutral-900',
        canSwipe && (isDragging ? 'cursor-grabbing' : onImageClick ? 'cursor-zoom-in' : 'cursor-grab'),
        !canSwipe && onImageClick && 'cursor-zoom-in',
        className
      )}
    >
      <motion.div
        className="flex h-full w-full will-change-transform"
        animate={{ x: `calc(-${safeIndex * 100}% + ${dragOffset}px)` }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 }
        }
      >
        {images.map((src, idx) => (
          <div key={`${src}-${idx}`} className="w-full h-full flex-shrink-0">
            <img
              src={src}
              alt={`${alt} ${images.length > 1 ? `(${idx + 1}/${images.length})` : ''}`}
              draggable={false}
              referrerPolicy="no-referrer"
              className={cn(
                'w-full h-full object-cover pointer-events-none select-none',
                imageClassName
              )}
            />
          </div>
        ))}
      </motion.div>

      {/* Subtle tap-to-zoom affordance */}
      {onImageClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(safeIndex);
          }}
          aria-label="Open fullscreen zoom"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/75 flex items-center justify-center transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      )}

      {/* Subtle scrim and pagination bars for multi-image products */}
      {canSwipe && showIndicators && (
        <div
          className={cn(
            'absolute inset-x-0 z-10 pointer-events-none flex items-center justify-center gap-1.5 px-4',
            indicatorPosition === 'top'
              ? 'top-0 pt-3 pb-6 bg-gradient-to-b from-black/45 to-transparent'
              : 'bottom-0 pb-3 pt-8 bg-gradient-to-t from-black/55 via-black/20 to-transparent'
          )}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`View image ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChangeIndex(i);
              }}
              className={cn(
                'pointer-events-auto h-1 rounded-full transition-all duration-300',
                safeIndex === i
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/35 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
