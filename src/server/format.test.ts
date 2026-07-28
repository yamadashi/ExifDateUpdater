import { describe, expect, it } from 'vitest'
import {
  applyTimezoneOffset,
  formatExifDate,
  formatFilename,
  hashPassword,
  passwordMatches,
  removeExtension,
} from './format.js'

describe('hashPassword', () => {
  it('returns the same hash for the same input', () => {
    expect(hashPassword('secret')).toBe(hashPassword('secret'))
  })

  it('returns different hashes for different input', () => {
    expect(hashPassword('secret')).not.toBe(hashPassword('other'))
  })

  it('returns a 64-character hex sha256 digest', () => {
    expect(hashPassword('secret')).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('passwordMatches', () => {
  it('returns true for equal hashes', () => {
    const hash = hashPassword('secret')
    expect(passwordMatches(hash, hash)).toBe(true)
  })

  it('returns false for different hashes', () => {
    expect(passwordMatches(hashPassword('secret'), hashPassword('other'))).toBe(
      false,
    )
  })

  it('returns false for different-length inputs without throwing', () => {
    expect(passwordMatches('short', hashPassword('secret'))).toBe(false)
  })
})

describe('removeExtension', () => {
  it('strips .jpg and .jpeg regardless of case', () => {
    expect(removeExtension('photo.jpg')).toBe('photo')
    expect(removeExtension('photo.JPEG')).toBe('photo')
  })

  it('leaves names without a matching extension untouched', () => {
    expect(removeExtension('photo.png')).toBe('photo.png')
  })
})

describe('formatFilename', () => {
  const date = new Date(2026, 0, 2, 3, 4, 5, 6)

  it('substitutes date tokens', () => {
    expect(formatFilename('[YYYY][MM][DD][HH][mm][ss]', date, 'a.jpg')).toBe(
      '20260102030405.jpg',
    )
  })

  it('substitutes [original] with the extension-stripped source name', () => {
    expect(formatFilename('[original]_backup', date, 'IMG_0001.jpeg')).toBe(
      'IMG_0001_backup.jpg',
    )
  })

  it('appends .jpg when the result has no jpg/jpeg extension', () => {
    expect(formatFilename('[YYYY]', date, 'a.jpg')).toBe('2026.jpg')
  })

  it('does not append an extra extension when already present', () => {
    expect(formatFilename('[YYYY].jpeg', date, 'a.jpg')).toBe('2026.jpeg')
  })

  it('strips path segments from a traversal attempt in the format string', () => {
    const result = formatFilename('../../../../tmp/evil', date, 'a.jpg')
    expect(result).not.toContain('/')
    expect(result).not.toContain('..')
  })

  it('strips path segments from a traversal attempt in the original name', () => {
    const result = formatFilename('[original]', date, '../../etc/passwd.jpg')
    expect(result).not.toContain('/')
  })
})

describe('applyTimezoneOffset', () => {
  it('adds positive hour offsets', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0)
    const result = applyTimezoneOffset(date, 9)
    expect(result.getHours()).toBe(9)
  })

  it('adds negative hour offsets', () => {
    const date = new Date(2026, 0, 1, 9, 0, 0)
    const result = applyTimezoneOffset(date, -9)
    expect(result.getHours()).toBe(0)
  })

  it('returns an equal instant for a zero offset', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0)
    expect(applyTimezoneOffset(date, 0).getTime()).toBe(date.getTime())
  })
})

describe('formatExifDate', () => {
  it('formats as EXIF-style "YYYY:MM:DD HH:mm:ss" with zero-padding', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatExifDate(date)).toBe('2026:01:02 03:04:05')
  })
})
