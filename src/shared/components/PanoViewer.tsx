"use client";

import React, { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";
import { Viewer } from "@photo-sphere-viewer/core";

type Props = {
  src: string; // z. B. "/panos/room.jpg"
};

export default function PanoViewer({ src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // neuen Viewer anlegen
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: src,
    });

    // aufräumen beim Unmount
    return () => {
      viewer.destroy();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "50vw",
        height: "50vh",
        overflow: "hidden",
      }}
    />
  );
}
