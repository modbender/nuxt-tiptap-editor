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
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

interface UploadFile {
  filename?: string
  type?: string
  data: Buffer
}

function sanitizeFilename(raw: string | undefined): string | null {
  if (!raw) return null
  // Strip any path components a malicious client tried to embed.
  const base = path.basename(raw)
  if (!base || base === '.' || base === '..') return null
  return base
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
    if (!ALLOWED_MIMES.includes(file.type as typeof ALLOWED_MIMES[number])) {
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

    const safeName = sanitizeFilename(file.filename)
    if (!safeName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid filename',
      })
    }

    // Prefix with a UUID so concurrent uploads can't collide and so a
    // crafted name can't overwrite something already in /public/uploads.
    const finalName = `${randomUUID()}-${safeName}`
    const filePath = path.join(fullUploadPath, finalName)
    await fs.writeFile(filePath, file.data)

    const urlPath = path.join(UPLOAD_DIR, finalName).replaceAll('\\', '/')
    uploadedFilePaths.push(`/${urlPath}`)
  }

  return uploadedFilePaths
})
