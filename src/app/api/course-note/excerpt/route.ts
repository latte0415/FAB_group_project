import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildCourseNoteExcerptFromParagraphs,
  courseNoteExcerptConfig,
} from "@/lib/config/course-note-excerpt-config";
import type { ApiResult } from "@/schemas/api-result";

type CourseNoteExcerptResponse = {
  title: string;
  text: string;
  sourcePath: string;
};

export async function GET(): Promise<
  NextResponse<ApiResult<CourseNoteExcerptResponse>>
> {
  try {
    const filePath = path.join(process.cwd(), courseNoteExcerptConfig.sourcePath);
    const text = await readFile(filePath, "utf-8");
    const excerptText = buildCourseNoteExcerptFromParagraphs(text);

    return NextResponse.json({
      ok: true,
      data: {
        title: courseNoteExcerptConfig.title,
        text: excerptText,
        sourcePath: courseNoteExcerptConfig.sourcePath,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "COURSE_NOTE_EXCERPT_NOT_FOUND",
          message: "Failed to load some course note text.",
        },
      },
      { status: 500 },
    );
  }
}
