"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import type { Core, ElementDefinition } from "cytoscape";
import type { JundevOsGraph, JundevOsGraphNode } from "@/lib/jundevos-snapshot";

type Props = { graph: JundevOsGraph };

const TYPE_LABEL: Record<JundevOsGraphNode["type"], string> = {
  system: "system",
  event: "event",
  decision: "decision",
  job: "job",
  report: "report",
  vault: "vault",
};

export function GraphView({ graph }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<JundevOsGraphNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const elements: ElementDefinition[] = [
      ...graph.nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          color: n.color,
          size: n.size,
          type: n.type,
        },
      })),
      ...graph.edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target, edge_type: e.type },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            "font-size": 9,
            color: "#1a1a1a",
            "text-valign": "bottom",
            "text-margin-y": 4,
            "text-wrap": "ellipsis",
            "text-max-width": "80px",
            width: "data(size)",
            height: "data(size)",
            "border-width": 1,
            "border-color": "rgba(0,0,0,0.2)",
          },
        },
        {
          selector: 'node[type = "system"]',
          style: {
            "border-width": 3,
            "border-color": "rgba(0,0,0,0.4)",
            "font-size": 12,
            "font-weight": "bold",
            "text-valign": "center",
            color: "#ffffff",
            "text-outline-color": "rgba(0,0,0,0.4)",
            "text-outline-width": 1,
          },
        },
        {
          selector: 'node[type = "vault"]',
          style: {
            shape: "round-rectangle",
            "border-width": 1,
            "border-color": "rgba(133,77,14,0.5)",
            "font-size": 8,
            "background-opacity": 0.8,
          },
        },
        {
          selector: 'edge[edge_type = "wikilinks_to"]',
          style: {
            "line-style": "dashed",
            "line-color": "rgba(133,77,14,0.4)",
            "target-arrow-color": "rgba(133,77,14,0.6)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "rgba(0,0,0,0.2)",
            "target-arrow-color": "rgba(0,0,0,0.4)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.6,
          },
        },
        {
          selector: ":selected",
          style: { "border-width": 3, "border-color": "#0ea5e9" },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 80,
        edgeElasticity: 100,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 2.5,
    });

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id();
      const node = graph.nodes.find((n) => n.id === id) ?? null;
      setSelected(node);
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) setSelected(null);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="h-[480px] w-full rounded-xl border border-black/10 bg-[#fbfaf6]"
        style={{ touchAction: "none" }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-black/60">
        <span className="font-semibold text-black/70">시스템:</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />jarvis</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a78bfa]" />tech</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" />money</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]" />agents</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ec4899]" />integrations</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#854d0e]" />vault note</span>
        <span className="ml-3 font-semibold text-black/70">edge:</span>
        <span>emits / summarizes / raised_by / owned_by / awaits / wikilinks_to (점선)</span>
        <span className="ml-3 text-black/40">노드 크기 = level (L0=16 / L1=22 / L2=30 / L3=40)</span>
      </div>
      {selected ? (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="rounded-md bg-sky-200/60 px-2 py-0.5 text-[10px] font-semibold uppercase">
              {TYPE_LABEL[selected.type]}
            </span>
            <span className="font-semibold">{selected.label}</span>
          </div>
          <p className="mt-1 text-black/60">id: {selected.id}</p>
          {selected.source_system ? (
            <p className="text-black/60">source_system: {selected.source_system}</p>
          ) : null}
          {selected.level ? <p className="text-black/60">level: {selected.level}</p> : null}
          {selected.status ? <p className="text-black/60">status: {selected.status}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
