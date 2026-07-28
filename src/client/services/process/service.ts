import api from '@services/api'

export type ProcessResponse = {
  batchId: string
}

export async function processFiles(
  formData: FormData,
): Promise<ProcessResponse> {
  const res = await api.post<ProcessResponse>('/process', formData)
  return res.data
}
