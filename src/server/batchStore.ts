import fs from 'fs'
import path from 'path'

export type BatchMeta = {
  expiresAt: number
  passwordHash?: string
}

const BATCH_ID_PATTERN = /^[a-zA-Z0-9-]+$/

export function isValidBatchId(batchId: string): boolean {
  return BATCH_ID_PATTERN.test(batchId)
}

function metaFilePath(metaRoot: string, batchId: string): string {
  return path.join(metaRoot, `${batchId}.json`)
}

export async function saveBatchMeta(
  metaRoot: string,
  batchId: string,
  meta: BatchMeta,
): Promise<void> {
  await fs.promises.writeFile(
    metaFilePath(metaRoot, batchId),
    JSON.stringify(meta),
  )
}

export async function readBatchMeta(
  metaRoot: string,
  batchId: string,
): Promise<BatchMeta | null> {
  try {
    const content = await fs.promises.readFile(
      metaFilePath(metaRoot, batchId),
      'utf-8',
    )
    const meta = JSON.parse(content) as Partial<BatchMeta>
    if (typeof meta.expiresAt !== 'number') {
      return null
    }
    return { expiresAt: meta.expiresAt, passwordHash: meta.passwordHash }
  } catch {
    return null
  }
}

export async function deleteBatchMeta(
  metaRoot: string,
  batchId: string,
): Promise<void> {
  await fs.promises.rm(metaFilePath(metaRoot, batchId), { force: true })
}

export async function listBatchIds(metaRoot: string): Promise<string[]> {
  const entries = await fs.promises.readdir(metaRoot, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.slice(0, -'.json'.length))
}
