type NoteEdgeStatus = "CANDIDATE" | "CONFIRMED" | "REJECTED";
type NoteEdgeOrigin = "AUTO" | "MANUAL";

export type NoteEdgeDto = {
  id: string;
  fromId: string;
  toId: string;
  relationType: string;
  weight: number | null;
  status: NoteEdgeStatus;
  origin: NoteEdgeOrigin;
  reason: string | null;
  updatedAt: string;
  from: {
    id: string;
    title: string;
  };
  to: {
    id: string;
    title: string;
  };
};

export type NoteEdgeViewItem = {
  edge: NoteEdgeDto;
  counterpart: {
    id: string;
    title: string;
  };
};

function sortByEdgeWeightDesc(a: NoteEdgeViewItem, b: NoteEdgeViewItem) {
  const aWeight = a.edge.weight ?? 0;
  const bWeight = b.edge.weight ?? 0;
  if (aWeight !== bWeight) {
    return bWeight - aWeight;
  }
  return new Date(b.edge.updatedAt).getTime() - new Date(a.edge.updatedAt).getTime();
}

export function splitEdgesByStatus(noteId: string, edges: NoteEdgeDto[]) {
  const related = edges
    .filter((edge) => edge.fromId === noteId || edge.toId === noteId)
    .map<NoteEdgeViewItem>((edge) => ({
      edge,
      counterpart: edge.fromId === noteId ? edge.to : edge.from,
    }));

  const confirmed = related.filter((item) => item.edge.status === "CONFIRMED").sort(sortByEdgeWeightDesc);
  const candidates = related.filter((item) => item.edge.status === "CANDIDATE").sort(sortByEdgeWeightDesc);

  return {
    confirmed,
    candidates,
  };
}
