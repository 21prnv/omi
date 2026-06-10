import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import SpriteText from "three-spritetext";
import type { GraphNode, GraphEdge } from "@/lib/api";

// Node colors by entity type (matches the macOS SceneKit brain map).
const NODE_COLORS: Record<string, string> = {
  user: "#FFFFFF",
  person: "#22D3EE",
  place: "#34D399",
  organization: "#FB923C",
  thing: "#C026D3",
  concept: "#3B82F6",
};

const USER_ID = "__user__";

interface GNode {
  id: string;
  label: string;
  node_type: string;
  val: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

// Real 3D force-directed knowledge graph (Three.js). Lazy-loaded so three.js
// only ships when the Memories brain map is shown. A synthetic white "you" node
// is pinned at the center with every entity radiating from it (like macOS).
export default function BrainMap({
  nodes,
  edges,
  userName,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  userName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 330 });

  useEffect(() => {
    const update = () =>
      containerRef.current &&
      setDims({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const degree: Record<string, number> = {};
    for (const e of edges) {
      degree[e.source_id] = (degree[e.source_id] ?? 0) + 1;
      degree[e.target_id] = (degree[e.target_id] ?? 0) + 1;
    }
    const userNode: GNode = {
      id: USER_ID,
      label: userName,
      node_type: "user",
      val: 12,
      fx: 0,
      fy: 0,
      fz: 0, // pin at origin
    };
    const entityNodes = nodes.map<GNode>((n) => ({
      id: n.id,
      label: n.label,
      node_type: n.node_type,
      val: 2 + (degree[n.id] ?? 0),
    }));
    return {
      nodes: [userNode, ...entityNodes],
      links: [
        // Real entity↔entity relationships.
        ...edges.map((e) => ({ source: e.source_id, target: e.target_id })),
        // Radial links from the user center to every entity.
        ...nodes.map((n) => ({ source: USER_ID, target: n.id })),
      ],
    };
  }, [nodes, edges, userName]);

  return (
    <div ref={containerRef} className="h-full min-h-[200px] w-full">
      <ForceGraph3D
        graphData={data}
        width={dims.w}
        height={dims.h}
        backgroundColor="#000000"
        showNavInfo={false}
        nodeRelSize={4}
        nodeVal={(n: GNode) => n.val}
        nodeColor={(n: GNode) => NODE_COLORS[n.node_type] ?? "#C026D3"}
        nodeOpacity={0.95}
        // Always-visible text label below each node sphere.
        nodeThreeObjectExtend
        nodeThreeObject={(n: GNode) => {
          const sprite = new SpriteText(n.label);
          sprite.color = n.node_type === "user" ? "#FFFFFF" : "#B0B0B0";
          sprite.textHeight = n.node_type === "user" ? 4 : 3;
          (sprite as unknown as { position: { set(x: number, y: number, z: number): void } }).position.set(
            0,
            -(6 + n.val * 0.6),
            0
          );
          return sprite;
        }}
        linkColor={() => "rgba(255,255,255,0.6)"}
        linkWidth={0.5}
        warmupTicks={80}
        cooldownTicks={150}
      />
    </div>
  );
}
