"use client";

import React, { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
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

    // ===== deine Nodes (aus deinen SCENES) =====
    const nodes = [
      {
        id: "floor1",
        panorama: "/panos/01.jpg",
        name: "Floor 1",
        // Pfeil von 1 -> 2 (nach vorne, leicht nach unten)
        links: [{ nodeId: "floor2", position: { yaw: "0deg", pitch: "-30deg" } }],
        // optional, wenn du bereits Marker hast:
        // markers: [{ id:'m1', position:{ yaw:'45deg', pitch:'0deg' }, tooltip:'Info' }],
        thumbnail: "/panos/thumbs/01.jpg", // optional
        caption: "Floor 1",
        sphereCorrection: { pan: "0deg" }, // optional
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

    // ===== Viewer wie im Doku-Beispiel =====
    const viewer = new Viewer({
      container: containerRef.current,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: true,
      defaultYaw: "130deg",
      navbar: "zoom move gallery caption fullscreen", // Doku-Style
      plugins: [
        MarkersPlugin,
        GalleryPlugin.withConfig({
          thumbnailSize: { width: 96, height: 96 },
        }),
        VirtualTourPlugin.withConfig({
          nodes,
          startNodeId: startId,     // "floor2" wie im Beispiel
          positionMode: "manual",   // wir nutzen yaw/pitch statt GPS
          renderMode: "3d", 
        }),
      ],
    });

    // (optional) Logging wie in der Doku sinnvoll
    const vt = viewer.getPlugin(VirtualTourPlugin);
    vt.addEventListener("node-changed", (e: any) => {
      // console.log("➡️ node:", e.node?.id);
    });
    vt.addEventListener("select-link", (e: any) => {
      // console.log("🔗 to:", e.link?.nodeId);
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
