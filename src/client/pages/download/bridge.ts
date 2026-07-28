import * as DownloadService from '@services/download/service'
import * as BatchService from '@services/batch/service'
import type { BatchInfo } from '@services/batch/service'

export async function getBatchInfo(batchId: string): Promise<BatchInfo> {
  return await BatchService.fetchBatch(batchId)
}

export async function requestDownloadUrl(
  batchId: string,
  password: string,
): Promise<string> {
  const res = await DownloadService.fetchDownload(batchId, password)
  return URL.createObjectURL(res.data)
}
