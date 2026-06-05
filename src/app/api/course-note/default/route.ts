import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { ApiResult } from "@/schemas/api-result";

type DefaultCourseNoteResponse = {
  title: string;
  text: string;
  sourcePath: string;
};

const defaultCourseNote = {
  title: "Course Notes - Session 2: Information Processing",
  sourcePath: "docs/course-note-full.txt",
};

export async function GET(): Promise<
  NextResponse<ApiResult<DefaultCourseNoteResponse>>
> {
  try {
    const filePath = path.join(process.cwd(), defaultCourseNote.sourcePath);
    const text = await readFile(filePath, "utf-8");

    return NextResponse.json({
      ok: true,
      data: {
        ...defaultCourseNote,
        text,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DEFAULT_COURSE_NOTE_NOT_FOUND",
          message: "Failed to load the default course note text file.",
        },
      },
      { status: 500 },
    );
  }
}
