import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "qualitative-ontology-learning-system",
    stage: "server-setup",
  });
}
