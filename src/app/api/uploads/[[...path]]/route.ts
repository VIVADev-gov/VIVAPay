import fs from "fs/promises";
import { NextResponse } from "next/server";
import { resolveReadableUploadAbsolutePath } from "@/lib/uploadsStorage";

const contentTypeByExtension: Record<string, string> = {
  pdf: "application/pdf",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  const dbPath = `/api/uploads/${path.join("/")}`;
  const absolutePath = await resolveReadableUploadAbsolutePath(dbPath);

  if (!absolutePath) {
    return NextResponse.json(
      { success: false, message: "Archivo no encontrado" },
      { status: 404 }
    );
  }

  const buffer = await fs.readFile(absolutePath);
  const extension = path.at(-1)?.split(".").pop()?.toLowerCase() ?? "";
  const contentType =
    contentTypeByExtension[extension] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
    },
  });
}
