import * as ProcessService from '@services/process/service'
import type { ProcessResponse } from '@services/process/service'

export async function submitUpload(formData: FormData): Promise<ProcessResponse> {
  return await ProcessService.processFiles(formData)
}
