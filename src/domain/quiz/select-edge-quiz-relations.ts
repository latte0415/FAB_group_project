export function selectEdgeQuizRelations<T extends { id: string }>(
  relations: T[],
  count: number,
): T[] {
  if (relations.length === 0 || count <= 0) {
    return [];
  }

  const sorted = [...relations].sort((left, right) => left.id.localeCompare(right.id));

  if (sorted.length <= count) {
    return sorted;
  }

  if (count === 1) {
    return [sorted[0]!];
  }

  const indices = Array.from({ length: count }, (_, index) =>
    Math.round((index * (sorted.length - 1)) / (count - 1)),
  );

  return indices.map((index) => sorted[index]!);
}
