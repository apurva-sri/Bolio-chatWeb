import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ImagePreview = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Close on Escape, zoom with keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=")
        setScale((s) => Math.min(s + 0.25, 4));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "0") {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 4));
  }, []);

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "image";
    link.click();
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const zoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5));
    if (scale <= 1.25) setPosition({ x: 0, y: 0 });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex flex-col"
      style={{ backgroundColor: "#0b141a" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ====== TOP BAR ====== */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: "#202c33" }}
      >
        {/* Left: sender info placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#374045] flex items-center justify-center text-[#aebac1] text-sm font-semibold">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
          <div>
            <p className="text-[#e9edef] text-sm font-medium leading-tight">
              Image
            </p>
            <p className="text-[#8696a0] text-xs">
              Click and drag to pan · Scroll to zoom
            </p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1">
          {/* Download */}
          <button
            onClick={handleDownload}
            title="Download"
            className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </button>

          {/* Forward placeholder */}
          <button
            title="Forward"
            className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
              <path d="M12 8V4l8 8-8 8v-4H4V8z" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="w-10 h-10 rounded-full hover:bg-[#374045] flex items-center justify-center transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ====== IMAGE AREA ====== */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={imageUrl}
          alt="preview"
          draggable={false}
          onMouseDown={handleMouseDown}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease",
            maxHeight: "calc(100vh - 140px)",
            maxWidth: "90vw",
            objectFit: "contain",
            userSelect: "none",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* ====== BOTTOM ZOOM BAR ====== */}
      <div
        className="flex items-center justify-center gap-3 py-3 shrink-0"
        style={{ backgroundColor: "#202c33" }}
      >
        <button
          onClick={zoomOut}
          disabled={scale <= 0.5}
          title="Zoom out (-)"
          className="w-9 h-9 rounded-full hover:bg-[#374045] flex items-center justify-center transition disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
          </svg>
        </button>

        {/* Zoom level pill */}
        <button
          onClick={resetZoom}
          title="Reset zoom (0)"
          className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#e9edef] hover:bg-[#374045] transition min-w-[60px] text-center"
          style={{ backgroundColor: "#2a3942" }}
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={zoomIn}
          disabled={scale >= 4}
          title="Zoom in (+)"
          className="w-9 h-9 rounded-full hover:bg-[#374045] flex items-center justify-center transition disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#aebac1]">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-5h2v1.5H11V11h-1.5V9.5H8V8.5h1.5V7H11v1.5z" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default ImagePreview;
