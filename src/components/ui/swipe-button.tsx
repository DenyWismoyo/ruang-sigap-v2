"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";

interface SwipeButtonProps {
  onSuccess: () => void | Promise<void>;
  text?: string;
  disabled?: boolean;
  isLoading?: boolean;
  color?: "blue" | "orange" | "green" | "slate";
  className?: string;
}

export function SwipeButton({
  onSuccess,
  text = "Geser Untuk Absen",
  disabled = false,
  isLoading = false,
  color = "blue",
  className = "",
}: SwipeButtonProps) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const getThemeStyles = () => {
    switch (color) {
      case "orange":
        return {
          trackBg: "bg-amber-500/15 dark:bg-amber-950/40 border-amber-400/40 dark:border-amber-700/50",
          trackFill: "bg-amber-500/30",
          handleBg: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30",
          textColor: "text-amber-700 dark:text-amber-300 font-bold",
        };
      case "green":
        return {
          trackBg: "bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-400/40 dark:border-emerald-700/50",
          trackFill: "bg-emerald-500/30",
          handleBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30",
          textColor: "text-emerald-700 dark:text-emerald-300 font-bold",
        };
      case "slate":
        return {
          trackBg: "bg-slate-200/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700",
          trackFill: "bg-slate-400/30",
          handleBg: "bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 shadow-slate-900/30",
          textColor: "text-slate-700 dark:text-slate-200 font-bold",
        };
      case "blue":
      default:
        return {
          trackBg: "bg-blue-500/15 dark:bg-blue-950/40 border-blue-400/40 dark:border-blue-700/50",
          trackFill: "bg-blue-500/30",
          handleBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30",
          textColor: "text-blue-700 dark:text-blue-300 font-bold",
        };
    }
  };

  const theme = getThemeStyles();

  const handleStart = (clientX: number) => {
    if (disabled || isLoading || isSuccess) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled || isLoading || isSuccess || !containerRef.current || !handleRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const handleWidth = handleRef.current.offsetWidth;
      const maxDrag = containerWidth - handleWidth;

      if (maxDrag <= 0) return;

      const deltaX = clientX - startXRef.current;
      const progress = Math.min(Math.max(deltaX / maxDrag, 0), 1);
      setDragProgress(progress);

      if (progress >= 0.88) {
        setIsDragging(false);
        setIsSuccess(true);
        setDragProgress(1);
        try {
          onSuccess();
        } catch (e) {
          console.error("Swipe action error:", e);
        }
        // Auto reset after 1.5s
        setTimeout(() => {
          setIsSuccess(false);
          setDragProgress(0);
        }, 1500);
      }
    },
    [isDragging, disabled, isLoading, isSuccess, onSuccess]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress < 0.88) {
      setDragProgress(0);
    }
  }, [isDragging, dragProgress]);

  // Global event listeners when dragging with mouse or touch
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleWidth = 52;
  const trackStyle = containerRef.current
    ? { transform: `translateX(${dragProgress * (containerRef.current.offsetWidth - handleWidth)}px)` }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-14 rounded-2xl border p-1 select-none overflow-hidden transition-all duration-300 ${
        theme.trackBg
      } ${disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"} ${className}`}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onMouseDown={(e) => handleStart(e.clientX)}
    >
      {/* Dynamic Fill Bar */}
      <div
        className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-75 ${theme.trackFill}`}
        style={{ width: `${Math.max(dragProgress * 100, 0)}%` }}
      />

      {/* Background Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
        <span
          className={`text-xs md:text-sm uppercase tracking-wider font-semibold transition-opacity duration-200 ${
            theme.textColor
          } ${dragProgress > 0.4 ? "opacity-20" : "opacity-90"}`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
            </span>
          ) : isSuccess ? (
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4" /> Berhasil!
            </span>
          ) : (
            text
          )}
        </span>
      </div>

      {/* Draggable Thumb / Handle */}
      <div
        ref={handleRef}
        className={`absolute top-1 bottom-1 w-12 rounded-xl flex items-center justify-center shadow-md transition-transform ${
          isDragging ? "duration-0" : "duration-200 ease-out"
        } ${theme.handleBg}`}
        style={trackStyle}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSuccess ? (
          <Check className="w-5 h-5" />
        ) : (
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
