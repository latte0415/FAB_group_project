import { describe, expect, it } from "vitest";

import { selectEdgeQuizRelations } from "@/domain/quiz/select-edge-quiz-relations";

describe("selectEdgeQuizRelations", () => {
  it("spreads selections across all relations when more than the target count exist", () => {
    const relations = Array.from({ length: 10 }, (_, index) => ({
      id: `relation-${String(index + 1).padStart(2, "0")}`,
    }));

    const selected = selectEdgeQuizRelations(relations, 3);

    expect(selected).toHaveLength(3);
    expect(selected.map((relation) => relation.id)).toEqual([
      "relation-01",
      "relation-06",
      "relation-10",
    ]);
  });
});
