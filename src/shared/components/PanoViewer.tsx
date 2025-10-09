"use client";

import React, { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
// Falls dieser Pfad bei dir nicht existiert, einfach auskommentieren:
import "@photo-sphere-viewer/gallery-plugin/index.css";

import { Viewer } from "@photo-sphere-viewer/core";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { GalleryPlugin } from "@photo-sphere-viewer/gallery-plugin";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";

type Props = { width?: string; height?: string; startId?: string };

export default function PanoViewerVT({
  width = "100%",
  height = "70vh",
  startId = "floor2",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // ===== Szenen-Definition =====
    const nodes = [
      {
        id: "floor1",
        panorama: "/panos/01.jpg",
        name: "Floor 1",
        links: [{ nodeId: "floor2", position: { yaw: "0deg", pitch: "-30deg" } }],
        thumbnail: "/panos/thumbs/01.jpg",
        caption: "Floor 1",
      },
      {
        id: "floor2",
        panorama: "/panos/02.jpg",
        name: "Floor 2",
        links: [
          { nodeId: "floor3", position: { yaw: "325deg", pitch: "-30deg" } },
          { nodeId: "floor1", position: { yaw: "220deg", pitch: "-30deg" } },
        ],
        thumbnail: "/panos/thumbs/02.jpg",
        caption: "Floor 2",
      },
      {
        id: "floor3",
        panorama: "/panos/03.jpg",
        name: "Floor 3",
        links: [
          { nodeId: "floor4", position: { yaw: "320deg", pitch: "-30deg" } },
          { nodeId: "floor2", position: { yaw: "180deg", pitch: "-30deg" } },
          { nodeId: "floor5", position: { yaw: "115deg", pitch: "-30deg" } },
          { nodeId: "floor6", position: { yaw: "200deg", pitch: "0deg" } },
        ],
        thumbnail: "/panos/thumbs/03.jpg",
        caption: "Floor 3",
      },
      {
        id: "floor4",
        panorama: "/panos/04.jpg",
        name: "Floor 4",
        links: [{ nodeId: "floor3", position: { yaw: "145deg", pitch: "-30deg" } }],
        thumbnail: "/panos/thumbs/04.jpg",
        caption: "Floor 4",
      },
      {
        id: "floor5",
        panorama: "/panos/05.jpg",
        name: "Floor 5",
        links: [{ nodeId: "floor3", position: { yaw: "140deg", pitch: "-30deg" } }],
        thumbnail: "/panos/thumbs/05.jpg",
        caption: "Floor 5",
      },
      {
        id: "floor6",
        panorama: "/panos/06.jpg",
        name: "Floor 6",
        links: [{ nodeId: "floor3", position: { yaw: "80deg", pitch: "-40deg" } }],
        thumbnail: "/panos/thumbs/06.jpg",
        caption: "Floor 6",
      },
    ];

    // ===== kleine Helpers fürs Preloading =====
    const getNode = (id: string) => nodes.find((n) => n.id === id);
    const preloadImage = (url: string) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;
      img.decode?.().catch(() => {}); // Fehler egal – Browser cached trotzdem
      return img;
    };

    // ===== Viewer Setup =====
    const viewer = new Viewer({
      container: containerRef.current,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: true,
      defaultYaw: "130deg", // Spinner ausblenden
      navbar: "zoom move gallery caption fullscreen",
      plugins: [
        MarkersPlugin,
        GalleryPlugin.withConfig({ thumbnailSize: { width: 96, height: 96 } }),
        VirtualTourPlugin.withConfig({
          nodes,
          startNodeId: startId,
          positionMode: "manual",
          renderMode: "3d",
        }),
      ],
    });

    const vt = viewer.getPlugin(VirtualTourPlugin);

    // ==== PRELOAD: beim Start gleich die Nachbarn des Startknotens laden ====
    const startNode = getNode(startId);
    startNode?.links?.forEach((l) => {
      const t = getNode(l.nodeId);
      if (t?.panorama) preloadImage(t.panorama);
    });

    // ==== PRELOAD: nach jedem Szenenwechsel die Nachbarn vorladen ====
    vt.addEventListener("node-changed", ({ node }: any) => {
      node?.links?.forEach((link: any) => {
        const target = getNode(link.nodeId);
        if (target?.panorama) preloadImage(target.panorama);
      });
    });

    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [startId]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid #eee",
      }}
    />
  );
}
