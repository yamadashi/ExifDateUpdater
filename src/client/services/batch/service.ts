import api from '@services/api'

export type BatchInfo = {
  expiresAt: number
  passwordProtected: boolean
}

export async function fetchBatch(batchId: string): Promise<BatchInfo> {
  const res = await api.get<BatchInfo>(
    `/batch/${encodeURIComponent(batchId)}`,
  )
  return res.data
}
