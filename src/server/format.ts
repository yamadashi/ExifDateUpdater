import { createHash, timingSafeEqual } from 'crypto'
import path from 'path'
import dayjs from 'dayjs'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function passwordMatches(candidateHash: string, storedHash: string): boolean {
  const a = Buffer.from(candidateHash)
  const b = Buffer.from(storedHash)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function removeExtension(filename: string): string {
  return filename.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '')
}

export function formatFilename(
  format: string,
  date: Date,
  originalName: string,
): string {
  const d = dayjs(date)
  let result = format
    .replaceAll('[YYYY]', d.format('YYYY'))
    .replaceAll('[MM]', d.format('MM'))
    .replaceAll('[DD]', d.format('DD'))
    .replaceAll('[HH]', d.format('HH'))
    .replaceAll('[mm]', d.format('mm'))
    .replaceAll('[ss]', d.format('ss'))
    .replaceAll('[SSS]', d.format('SSS'))
    .replaceAll('[original]', removeExtension(originalName))

  if (!result.endsWith('.jpg') && !result.endsWith('.jpeg')) {
    result += '.jpg'
  }

  return path.basename(result)
}

export function applyTimezoneOffset(date: Date, offsetHours: number): Date {
  return dayjs(date).add(offsetHours, 'hour').toDate()
}

export function formatExifDate(date: Date): string {
  return dayjs(date).format('YYYY:MM:DD HH:mm:ss')
}
