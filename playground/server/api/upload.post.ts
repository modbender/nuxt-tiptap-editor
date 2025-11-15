import path from 'node:path'
import fs from 'node:fs'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const uploadDir = 'uploads'
  const fullUploadPath = path.join(
    process.cwd(),
    'playground',
    'public',
    uploadDir,
  )
  const files = await readMultipartFormData(event)

  const uploadedFilePaths: string[] = []

  if (!fs.existsSync(fullUploadPath)) {
    await fs.promises.mkdir(fullUploadPath, { recursive: true })
  }

  files?.forEach((file: { filename?: string, data: Buffer }) => {
    const filePath = path.join(fullUploadPath, file.filename as string)
    fs.writeFileSync(filePath, file.data)
    const urlPath = path
      .join(uploadDir, file.filename as string)
      .replaceAll('\\', '/')
    uploadedFilePaths.push(`/${urlPath}`)
  })

  return uploadedFilePaths
})
