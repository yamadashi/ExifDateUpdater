import api from '@services/api'

export async function fetchDownload(batchId: string, password: string) {
  return await api.post<Blob>(
    `/download/${encodeURIComponent(batchId)}`,
    { pw: password },
    { responseType: 'blob' },
  )
}
