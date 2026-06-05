export const courseNoteExcerptConfig = {
  title:
    "Session 2 — Shared terminology & channel capacity (excerpt)",
  sourcePath: "docs/course-note-full.txt",
  /**
   * Paragraph indices in `docs/course-note-full.txt` (split on blank lines).
   * Covers shared terminology, credit-assignment framing, and Shannon channel capacity.
   */
  paragraphIndices: [8, 9, 10, 11, 12, 13, 14, 20, 21, 37, 38, 39, 40, 41],
} as const;

export function splitCourseNoteParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildCourseNoteExcerptFromParagraphs(fullText: string): string {
  const paragraphs = splitCourseNoteParagraphs(fullText);

  return courseNoteExcerptConfig.paragraphIndices
    .map((index) => paragraphs[index])
    .filter((paragraph): paragraph is string => Boolean(paragraph))
    .join("\n\n");
}
