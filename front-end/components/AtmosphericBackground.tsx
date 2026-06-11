"use client";

import { useEffect } from "react";

export function AtmosphericBackground() {
  useEffect(() => {
    const blobs = document.querySelectorAll<HTMLElement>(".blob");
    if (!blobs.length) return;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      blobs.forEach((blob, index) => {
        const shiftX = (x - 0.5) * (index + 1) * 20;
        const shiftY = (y - 0.5) * (index + 1) * 20;
        blob.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <div className="blob h-[400px] w-[400px] -left-20 -top-20 bg-primary-fixed" />
      <div
        className="blob h-[300px] w-[300px] -right-20 top-1/2 bg-secondary-fixed"
      />
      <div className="blob bottom-0 left-1/4 h-[500px] w-[500px] bg-primary-container" />
    </>
  );
}
