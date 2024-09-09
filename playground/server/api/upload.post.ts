import path from 'path';
import fs from 'fs';

export default defineEventHandler(async (event) => {
  const uploadDir = 'uploads';
  const fullUploadPath = path.join(
    process.cwd(),
    'playground',
    'public',
    uploadDir,
  );
  const files = await readMultipartFormData(event);

  const uploadedFilePaths: string[] = [];

  if (!fs.existsSync(fullUploadPath)) {
    await fs.promises.mkdir(fullUploadPath, { recursive: true });
  }

  files?.forEach((file) => {
    const filePath = path.join(fullUploadPath, file.filename as string);
    fs.writeFileSync(filePath, file.data);
    const urlPath = path
      .join(uploadDir, file.filename as string)
      .replaceAll('\\', '/');
    uploadedFilePaths.push(`/${urlPath}`);
  });

  return uploadedFilePaths;
});
