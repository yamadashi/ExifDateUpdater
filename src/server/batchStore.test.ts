import { describe, expect, it } from 'vitest'
import { isValidBatchId } from './batchStore.js'

describe('isValidBatchId', () => {
  it('accepts the generated batchId shape (timestamp-uuid)', () => {
    expect(isValidBatchId('1779970581049-ac617447-3a08-412e-b661-5e5d98fb0723')).toBe(
      true,
    )
  })

  it('rejects path traversal attempts', () => {
    expect(isValidBatchId('..')).toBe(false)
    expect(isValidBatchId('../../etc/passwd')).toBe(false)
    expect(isValidBatchId('foo/../bar')).toBe(false)
  })

  it('rejects path separators and dots', () => {
    expect(isValidBatchId('foo/bar')).toBe(false)
    expect(isValidBatchId('foo\\bar')).toBe(false)
    expect(isValidBatchId('foo.json')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidBatchId('')).toBe(false)
  })
})
