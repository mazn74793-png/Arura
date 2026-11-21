import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageZoomModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function ImageZoomModal({
  images,
  initialIndex,
  isOpen,
  onClose,
  alt,
}: ImageZoomModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    hasMoved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    hasMoved: false,
  });

  const pinchRef = useRef<{
    active: boolean;
    startDist: number;
    startScale: number;
  }>({
    active: false,
    startDist: 0,
    startScale: 1,
  });

  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && activeIndex < images.length - 1) {
        setActiveIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, images.length, onClose]);

  const clampPan = (x: number, y: number, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 };
    const stage = stageRef.current;
    if (!stage) return { x, y };
    const maxX = ((currentScale - 1) * stage.offsetWidth) / 2;
    const maxY = ((currentScale - 1) * stage.offsetHeight) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const applyScale = (nextScale: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2))));
    setScale(clamped);
    setPan((prev) => clampPan(prev.x, prev.y, clamped));
  };

  const toggleDoubleTapZoom = () => {
    if (scale > 1.05) {
      applyScale(1);
    } else {
      applyScale(2.5);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    applyScale(scale + delta);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return; // Handled by touch events to support pinch + pan
    if (e.button !== 0) return;

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      hasMoved: false,
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const d = dragRef.current;
    if (!d.active) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      d.hasMoved = true;
    }

    if (scale > 1) {
      setPan(clampPan(d.startPanX + dx, d.startPanY + dy, scale));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const d = dragRef.current;
    if (!d.active) return;

    const dx = e.clientX - d.startX;
    if (scale <= 1 && Math.abs(dx) > 50) {
      if (dx < 0 && activeIndex < images.length - 1) {
        setActiveIndex((i) => i + 1);
      } else if (dx > 0 && activeIndex > 0) {
        setActiveIndex((i) => i - 1);
      }
    }

    d.active = false;
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
  };

  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      dragRef.current.active = false;
      pinchRef.current = {
        active: true,
        startDist: getTouchDist(e.touches),
        startScale: scale,
      };
      setIsDragging(true);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        toggleDoubleTapZoom();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      dragRef.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        hasMoved: false,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / Math.max(1, pinchRef.current.startDist);
      applyScale(pinchRef.current.startScale * ratio);
    } else if (e.touches.length === 1 && dragRef.current.active) {
      const d = dragRef.current;
      const dx = e.touches[0].clientX - d.startX;
      const dy = e.touches[0].clientY - d.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        d.hasMoved = true;
      }
      if (scale > 1) {
        setPan(clampPan(d.startPanX + dx, d.startPanY + dy, scale));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pinchRef.current.active && e.touches.length < 2) {
      pinchRef.current.active = false;
    }

    if (e.touches.length === 0 && dragRef.current.active) {
      const d = dragRef.current;
      const changedTouch = e.changedTouches[0];
      if (changedTouch && scale <= 1) {
        const dx = changedTouch.clientX - d.startX;
        if (Math.abs(dx) > 50) {
          if (dx < 0 && activeIndex < images.length - 1) {
            setActiveIndex((i) => i + 1);
          } else if (dx > 0 && activeIndex > 0) {
            setActiveIndex((i) => i - 1);
          }
        }
      }
      d.active = false;
      setIsDragging(false);
    } else if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const currentSrc = images[activeIndex] || images[0] || '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col select-none"
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 z-20">
            <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              {images.length > 1 ? `${activeIndex + 1} / ${images.length}` : alt}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyScale(scale - 0.5)}
                disabled={scale <= MIN_SCALE}
                aria-label="Zoom out"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="min-w-[48px] text-center font-mono text-xs tabular-nums text-neutral-300">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={() => applyScale(scale + 0.5)}
                disabled={scale >= MAX_SCALE}
                aria-label="Zoom in"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {scale > 1 && (
                <button
                  type="button"
                  onClick={() => applyScale(1)}
                  aria-label="Reset zoom"
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:border-white/30 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Close zoom view"
                className="w-10 h-10 ml-2 flex items-center justify-center rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Zoom Stage */}
          <div
            ref={stageRef}
            onWheel={handleWheel}
            onDoubleClick={toggleDoubleTapZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
            className={cn(
              'relative flex-1 overflow-hidden flex items-center justify-center p-2 md:p-6',
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            )}
          >
            <motion.img
              key={currentSrc}
              src={currentSrc}
              alt={alt}
              draggable={false}
              referrerPolicy="no-referrer"
              animate={{
                scale,
                x: pan.x,
                y: pan.y,
              }}
              transition={
                isDragging
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 320, damping: 32 }
              }
              className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none select-none"
            />
          </div>

          {/* Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto z-20">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    'w-12 h-14 flex-shrink-0 border overflow-hidden transition-all bg-neutral-900',
                    activeIndex === idx ? 'border-white' : 'border-white/10 opacity-45 hover:opacity-100'
                  )}
                >
                  <img
                    src={img}
                    alt={`${alt} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
