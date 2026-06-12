import "server-only";

import path from "path";
import { resolveReadableUploadAbsolutePath } from "@/lib/uploadsStorage";
import type { FillXlsxImageExtension } from "./fillXlsxTemplate";

function resolveImageExtension(
  absolutePath: string
): FillXlsxImageExtension | null {
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext === ".png") return "png";
  if (ext === ".jpg" || ext === ".jpeg") return "jpeg";
  if (ext === ".gif") return "gif";
  return null;
}

export async function resolveFormSignatureImage(
  signaturePath: string | null,
  missingMessage: string,
  notFoundMessage: string,
  invalidFormatMessage: string
): Promise<{ absolutePath: string; extension: FillXlsxImageExtension }> {
  if (!signaturePath) {
    throw new Error(missingMessage);
  }

  const absolutePath = await resolveReadableUploadAbsolutePath(signaturePath);
  if (!absolutePath) {
    throw new Error(notFoundMessage);
  }

  const extension = resolveImageExtension(absolutePath);
  if (!extension) {
    throw new Error(invalidFormatMessage);
  }

  return { absolutePath, extension };
}
