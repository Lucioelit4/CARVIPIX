import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { requireClientSession } from "@/app/api/client/_auth";
import { updateUserAvatar } from "@/app/lib/auth/server";

const MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 512;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_PUBLIC_PREFIX = "/uploads/avatars";
const AVATAR_STORAGE_ROOT = path.join(process.cwd(), "public", "uploads", "avatars");

function sanitizeUserKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function parseStoredAvatarPath(avatarUrl: string, userKey: string): string | null {
  const cleanUrl = avatarUrl.split("?")[0] || "";
  const expectedPrefix = `${AVATAR_PUBLIC_PREFIX}/${userKey}/`;
  if (!cleanUrl.startsWith(expectedPrefix)) {
    return null;
  }

  const fileName = path.basename(cleanUrl.slice(expectedPrefix.length));
  if (!fileName || fileName === "." || fileName === "..") {
    return null;
  }

  return path.join(AVATAR_STORAGE_ROOT, userKey, fileName);
}

async function removeOldAvatar(avatarUrl: string | null | undefined, userKey: string, nextAvatarUrl: string): Promise<void> {
  if (!avatarUrl || avatarUrl === nextAvatarUrl) {
    return;
  }

  const oldPath = parseStoredAvatarPath(avatarUrl, userKey);
  if (!oldPath) {
    return;
  }

  try {
    await fs.unlink(oldPath);
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code !== "ENOENT") {
      throw error;
    }
  }
}

function errorJson(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  const auth = await requireClientSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File)) {
      return errorJson("No se encontro archivo de imagen", 400);
    }

    if (!ALLOWED_MIMES.has(avatar.type)) {
      return errorJson("Formato de imagen no permitido", 400);
    }

    if (avatar.size <= 0 || avatar.size > MAX_BYTES) {
      return errorJson("El archivo excede el limite de 5MB", 400);
    }

    const avatarArrayBuffer = await avatar.arrayBuffer();
    const avatarBytes = new Uint8Array(avatarArrayBuffer);
    const avatarBytesCopy = new Uint8Array(avatarBytes);
    const sourceBuffer = Buffer.from(avatarBytesCopy);

    const normalized = await sharp(sourceBuffer)
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });

    if (!normalized.info.width || !normalized.info.height) {
      return errorJson("No se pudo procesar la imagen", 400);
    }

    const userKey = sanitizeUserKey(auth.user.id);
    const userFolder = path.join(AVATAR_STORAGE_ROOT, userKey);
    await fs.mkdir(userFolder, { recursive: true });

    const fileName = `${Date.now()}-${randomBytes(8).toString("hex")}.webp`;
    const targetPath = path.join(userFolder, fileName);
    await fs.writeFile(targetPath, normalized.data);

    const avatarUrl = `${AVATAR_PUBLIC_PREFIX}/${userKey}/${fileName}`;
    const previousAvatarUrl = auth.user.avatar_url ?? null;

    await updateUserAvatar(auth.user.id, avatarUrl);
    await removeOldAvatar(previousAvatarUrl, userKey, avatarUrl);

    return NextResponse.json({ ok: true, data: { avatarUrl } }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la foto de perfil";
    return errorJson(message, 400);
  }
}
