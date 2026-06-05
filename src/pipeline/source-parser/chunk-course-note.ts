import type { SourceChunk } from "@/schemas/benchmark-ontology";

type ChunkCourseNoteInput = {
  text: string;
  title?: string;
};

type Section = {
  id: string;
  title?: string;
  lines: string[];
};

const sentenceBoundary = /(?<=[.!?。！？])\s+|\n+/u;

export function chunkCourseNote(input: ChunkCourseNoteInput): SourceChunk[] {
  const sections = splitIntoSections(input.text);
  const chunks: SourceChunk[] = [];

  for (const section of sections) {
    for (const line of section.lines) {
      if (isHeadingOnlyLine(line)) {
        continue;
      }

      const sentences = line
        .split(sentenceBoundary)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      sentences.forEach((sentence, sentenceIndex) => {
        chunks.push({
          id: `chunk-${String(chunks.length + 1).padStart(4, "0")}`,
          text: sentence,
          sourceTitle: input.title,
          sectionId: section.id,
          sectionTitle: section.title,
          sentenceIndex,
        });
      });
    }
  }

  return chunks;
}

function splitIntoSections(text: string): Section[] {
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: Section[] = [];
  let current: Section = createSection(1);

  for (const line of lines) {
    if (isLikelyHeading(line) && (current.title || current.lines.length > 0)) {
      sections.push(current);
      current = createSection(sections.length + 1, line);
      continue;
    }

    if (isLikelyHeading(line) && !current.title) {
      current.title = line;
      continue;
    }

    current.lines.push(line);
  }

  if (current.title || current.lines.length > 0) {
    sections.push(current);
  }

  return sections.length > 0 ? sections : [createSection(1)];
}

function createSection(index: number, title?: string): Section {
  return {
    id: `section-${String(index).padStart(3, "0")}`,
    title,
    lines: [],
  };
}

function isLikelyHeading(line: string): boolean {
  if (line.length > 80) {
    return false;
  }

  if (/^\d+(\.\d+)*\s+\S+/u.test(line)) {
    return true;
  }

  if (/^#{1,6}\s+\S+/u.test(line)) {
    return true;
  }

  if (line.endsWith(":")) {
    return true;
  }

  if (/^Course Notes\b/iu.test(line)) {
    return true;
  }

  if (line === line.toUpperCase() && /[A-Z]/u.test(line) && line.length < 60) {
    return true;
  }

  if (
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}$/u.test(line) &&
    line.length < 40 &&
    !line.includes(".")
  ) {
    return true;
  }

  return false;
}

function isHeadingOnlyLine(line: string): boolean {
  return isLikelyHeading(line) && !/[.!?。！？]/u.test(line);
}
