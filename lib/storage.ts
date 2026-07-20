import path from 'path';

/**
 * Returns the absolute path for file storage (documents, invoices, backups).
 * Uses Vercel's writable '/tmp' directory when running on Vercel, and project root locally.
 */
export function getStoragePath(...segments: string[]): string {
  const isVercel = process.env.VERCEL === '1';
  const baseDir = isVercel ? '/tmp' : process.cwd();
  return path.join(baseDir, 'storage', ...segments);
}
