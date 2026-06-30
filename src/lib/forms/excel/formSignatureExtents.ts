import "server-only";

import fs from "fs";
import type { FillXlsxImageExtension } from "./fillXlsxTemplate";

export const FORM_SIGNATURE_MAX_WIDTH = 210;
export const FORM_SIGNATURE_MAX_HEIGHT = 50;

function readPngDimensions(buffer: Buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Imagen PNG inválida");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readGifDimensions(buffer: Buffer) {
  if (buffer.length < 10 || buffer.toString("ascii", 0, 3) !== "GIF") {
    throw new Error("Imagen GIF inválida");
  }
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

function readJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Imagen JPEG inválida");
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      break;
    }

    const isSof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSof) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + segmentLength;
  }

  throw new Error("No se pudieron leer las dimensiones del JPEG");
}

export function readImageDimensions(
  absolutePath: string,
  extension: FillXlsxImageExtension
): { width: number; height: number } {
  const buffer = fs.readFileSync(absolutePath);

  switch (extension) {
    case "png":
      return readPngDimensions(buffer);
    case "gif":
      return readGifDimensions(buffer);
    case "jpeg":
      return readJpegDimensions(buffer);
    default:
      throw new Error(`Formato de imagen no soportado: ${extension}`);
  }
}

export function fitSignatureExtents(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = FORM_SIGNATURE_MAX_WIDTH,
  maxHeight = FORM_SIGNATURE_MAX_HEIGHT
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspect = naturalWidth / naturalHeight;
  let width = maxWidth;
  let height = Math.round(width / aspect);

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspect);
  }

  return { width, height };
}

export function resolveSignatureImageExtents(resolved: {
  absolutePath: string;
  extension: FillXlsxImageExtension;
}): { width: number; height: number } {
  const natural = readImageDimensions(
    resolved.absolutePath,
    resolved.extension
  );
  return fitSignatureExtents(natural.width, natural.height);
}
