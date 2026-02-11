import type { NoteEdgeDto } from "@/app/(private)/app/notes/_lib/detail";

const GRAPH_WIDTH = 560;
const GRAPH_HEIGHT = 320;
const GRAPH_CENTER_X = GRAPH_WIDTH / 2;
const GRAPH_CENTER_Y = GRAPH_HEIGHT / 2;
const GRAPH_RADIUS = 120;

export type NoteGraphNodeKind = "CENTER" | "CONFIRMED" | "CANDIDATE";

export type NoteGraphNode = {
  id: string;
  title: string;
  kind: NoteGraphNodeKind;
  x: number;
  y: number;
};

export type NoteGraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  status: "CONFIRMED" | "CANDIDATE";
  weight: number;
};

export type NoteGraphData = {
  width: number;
  height: number;
  nodes: NoteGraphNode[];
  edges: NoteGraphEdge[];
};

type CounterpartInfo = {
  id: string;
  title: string;
  kind: Exclude<NoteGraphNodeKind, "CENTER">;
  weight: number;
};

function pickNodeKind(current: CounterpartInfo | undefined, next: CounterpartInfo): CounterpartInfo {
  if (!current) {
    return next;
  }
  if (current.kind === "CONFIRMED") {
    return current;
  }
  if (next.kind === "CONFIRMED") {
    return next;
  }
  return current.weight >= next.weight ? current : next;
}

export function buildNoteGraph(noteId: string, noteTitle: string, edges: NoteEdgeDto[]): NoteGraphData {
  const relatedEdges = edges
    .filter((edge) => (edge.status === "CONFIRMED" || edge.status === "CANDIDATE") && (edge.fromId === noteId || edge.toId === noteId))
    .map((edge) => {
      const counterpart = edge.fromId === noteId ? edge.to : edge.from;
      const kind: Exclude<NoteGraphNodeKind, "CENTER"> = edge.status === "CONFIRMED" ? "CONFIRMED" : "CANDIDATE";
      return {
        edge,
        counterpart: {
          id: counterpart.id,
          title: counterpart.title,
          kind,
          weight: edge.weight ?? 0,
        },
      };
    })
    .sort((a, b) => (b.edge.weight ?? 0) - (a.edge.weight ?? 0));

  const counterpartMap = new Map<string, CounterpartInfo>();
  for (const item of relatedEdges) {
    const previous = counterpartMap.get(item.counterpart.id);
    counterpartMap.set(item.counterpart.id, pickNodeKind(previous, item.counterpart));
  }

  const counterparts = Array.from(counterpartMap.values());
  const positionedCounterparts = counterparts.map<NoteGraphNode>((item, index) => {
    const angle = counterparts.length === 0 ? 0 : (-Math.PI / 2) + ((Math.PI * 2 * index) / counterparts.length);
    return {
      id: item.id,
      title: item.title,
      kind: item.kind,
      x: GRAPH_CENTER_X + GRAPH_RADIUS * Math.cos(angle),
      y: GRAPH_CENTER_Y + GRAPH_RADIUS * Math.sin(angle),
    };
  });

  const nodes: NoteGraphNode[] = [
    {
      id: noteId,
      title: noteTitle,
      kind: "CENTER",
      x: GRAPH_CENTER_X,
      y: GRAPH_CENTER_Y,
    },
    ...positionedCounterparts,
  ];

  const edgesForGraph: NoteGraphEdge[] = relatedEdges.map((item) => ({
    id: item.edge.id,
    fromId: item.edge.fromId,
    toId: item.edge.toId,
    status: item.edge.status === "CONFIRMED" ? "CONFIRMED" : "CANDIDATE",
    weight: item.edge.weight ?? 0,
  }));

  return {
    width: GRAPH_WIDTH,
    height: GRAPH_HEIGHT,
    nodes,
    edges: edgesForGraph,
  };
}
