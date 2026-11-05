// ============================================================================
// DEMO ONLY — DO NOT USE IN PRODUCTION
// This handler exists to exercise the TiptapImageUpload extension during
// playground development. It writes uploaded files straight into the
// playground's public directory. A real handler would stream to object
// storage (S3, GCS, R2), enforce auth, log audit events, and probably
// virus-scan. Please do not copy this file into a production codebase.
// ============================================================================

import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const UPLOAD_DIR = 'uploads'
const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB

interface ImageFormat {
  ext: string
  matches: (data: Buffer) => boolean
}

function startsWith(data: Buffer, signature: number[], offset = 0): boolean {
  return signature.every((byte, i) => data[offset + i] === byte)
}

const PNG: ImageFormat = {
  ext: 'png',
  matches: data => startsWith(data, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
}
const JPEG: ImageFormat = {
  ext: 'jpg',
  matches: data => startsWith(data, [0xFF, 0xD8, 0xFF]),
}
const GIF: ImageFormat = {
  ext: 'gif',
  matches: data => startsWith(data, [0x47, 0x49, 0x46, 0x38]),
}
const WEBP: ImageFormat = {
  ext: 'webp',
  // "RIFF" <size> "WEBP"
  matches: data =>
    startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8),
}

// The stored extension comes from this map, never from the client filename,
// and the bytes must match the declared type.
const IMAGE_FORMATS = new Map<string, ImageFormat>([
  ['image/png', PNG],
  ['image/jpeg', JPEG],
  ['image/jpg', JPEG],
  ['image/gif', GIF],
  ['image/webp', WEBP],
])

interface UploadFile {
  filename?: string
  type?: string
  data: Buffer
}

export default defineEventHandler(async (event: H3Event) => {
  const fullUploadPath = path.join(
    process.cwd(),
    'playground',
    'public',
    UPLOAD_DIR,
  )

  if (!existsSync(fullUploadPath)) {
    await fs.mkdir(fullUploadPath, { recursive: true })
  }

  const files = (await readMultipartFormData(event)) as UploadFile[] | undefined
  if (!files?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })
  }

  const uploadedFilePaths: string[] = []

  for (const file of files) {
    const format = IMAGE_FORMATS.get(file.type ?? '')
    if (!format) {
      throw createError({
        statusCode: 415,
        statusMessage: `Unsupported media type: ${file.type ?? 'unknown'}`,
      })
    }

    if (file.data.byteLength > MAX_FILE_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: `File too large (max ${MAX_FILE_BYTES} bytes)`,
      })
    }

    if (!format.matches(file.data)) {
      throw createError({
        statusCode: 415,
        statusMessage: `File content does not match ${file.type}`,
      })
    }

    // A server-chosen name: concurrent uploads can't collide and a crafted
    // client filename can't pick the path or the served content type.
    const finalName = `${randomUUID()}.${format.ext}`
    const filePath = path.join(fullUploadPath, finalName)
    await fs.writeFile(filePath, file.data)

    const urlPath = path.join(UPLOAD_DIR, finalName).replaceAll('\\', '/')
    uploadedFilePaths.push(`/${urlPath}`)
  }

  return uploadedFilePaths
})
