"use client";

import React, { useEffect, useRef, useState } from "react";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";

/** ---- Deine Szenen + „Weiter“-Links ---- */
type Link = {
  to: string;           // Ziel-Szene-ID
  yawDeg: number;       // Richtung des Pfeils (0..360 Grad, Uhrzeigersinn)
  pitchDeg?: number;    // optional (z. B. leicht nach unten)
  label?: string;       // Tooltip
};

type Scene = {
  id: string;
  src: string;          // equirectangular JPG/PNG (2:1)
  links: Link[];        // wohin man „weitergehen“ kann
};

const SCENES: Scene[] = [
  {
    id: "floor1",
    src: "/panos/01.jpg",
    links: [
      { to: "floor2", yawDeg: 0, label: "" },
    ],
  },
  {
    id: "floor2",
    src: "/panos/02.jpg",
    links: [
      { to: "room", yawDeg: 325},
      { to: "floor1", yawDeg: 220},
    ],
  },
  /*{
    id: "balcony",
    src: "/panos/balcony.jpg",
    links: [
      { to: "room", yawDeg: 0,   label: "Zum Wohnzimmer" },
      { to: "hall", yawDeg: 320, label: "Zum Flur" },
    ],
  },*/
];

/** Einfacher runder Pfeil-Button als HTML-Marker */
const arrowHtml = (deg: number) => `
  <div style="
    width:50px;height:50px;border-radius:999px;background:transparent;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 10px rgba(0,0,0,.25);transform:rotate(${deg}deg);
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 7h-4v7h-6v-7H5l7-7z" fill="black"/>
    </svg>
  </div>
`;

type Props = { initialId?: string; width?: string; height?: string };

export default function PanoViewer({ initialId = "floor1", width = "100%", height = "70vh" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [activeId, setActiveId] = useState(initialId);

  useEffect(() => {
    if (!containerRef.current) return;

    // Viewer initialisieren (wie in der Doku)
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: getScene(activeId).src,
      plugins: [MarkersPlugin],
      navbar: ["zoom", "move", "fullscreen"],
      touchmoveTwoFingers: true,
    });

    viewerRef.current = viewer;

    // Pfeile für Startszene
    const markers = viewer.getPlugin(MarkersPlugin) as unknown as MarkersPlugin;
    renderArrows(markers, getScene(activeId));

    // Pfeil-Klicks → Szene wechseln
    markers.addEventListener("select-marker", ({ marker }) => {
      const targetId = marker?.data?.to as string | undefined;
      if (!targetId) return;
      switchScene(targetId);
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Szene wechseln + Pfeile neu setzen */
  const switchScene = async (targetId: string) => {
    const v = viewerRef.current;
    if (!v) return;
    const scene = getScene(targetId);
    setActiveId(targetId);

await v.setPanorama(scene.src, { showLoader: false, transition: { speed: 700 }  });
    const markers = v.getPlugin(MarkersPlugin) as unknown as MarkersPlugin;
    markers.clearMarkers();
    renderArrows(markers, scene);
  };

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

/** Hilfsfunktionen */
function getScene(id: string): Scene {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`Scene not found: ${id}`);
  return s;
}

function renderArrows(markers: MarkersPlugin, scene: Scene) {
  scene.links.forEach((link, i) => {
    // API akzeptiert auch Strings mit "deg" – bleibt 100% docs-konform
    const yaw = `${link.yawDeg}deg`;
    const pitch = `${link.pitchDeg ?? 0}deg`;

    markers.addMarker({
      id: `arrow-${scene.id}-${i}`,
      position: { yaw, pitch },
      tooltip: link.label ?? "Weiter",
      html: arrowHtml(0),
      anchor: "center",
      size: { width: 42, height: 42 },
      data: { to: link.to }, // Ziel-ID hier ablegen
    });
  });
}
