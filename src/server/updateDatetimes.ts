import fs from 'fs'
import { utimesSync } from 'utimes'
import { dump, insert, load, TagValues, IExif } from 'piexif-ts'
import { formatExifDate } from './format.js'

export function updateDatetimes(file: string, date: Date) {
  const ms = date.getMilliseconds()
  const subsec = ms > 0 ? String(ms).padStart(3, '0') : null

  updateExifDates(file, date, subsec)

  utimesSync(file, {
    btime: date.getTime(),
    mtime: date.getTime(),
  })
}

function updateExifDates(
  filePath: string,
  date: Date,
  subsec: string | null,
): void {
  const exifDate = formatExifDate(date)

  const buf = fs.readFileSync(filePath)
  const binaryStr = buf.toString('binary')

  const exifObj: IExif = load(binaryStr)

  if (exifObj['0th']) {
    exifObj['0th'][TagValues.ImageIFD.DateTime] = exifDate
  }

  if (exifObj.Exif) {
    exifObj.Exif[TagValues.ExifIFD.DateTimeOriginal] = exifDate
    exifObj.Exif[TagValues.ExifIFD.DateTimeDigitized] = exifDate

    if (subsec !== null) {
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTime)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTime] = subsec
      }
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTimeOriginal)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTimeOriginal] = subsec
      }
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTimeDigitized)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTimeDigitized] = subsec
      }
    }
  }

  if (exifObj['1st'] && TagValues.ImageIFD.DateTime in exifObj['1st']) {
    exifObj['1st'][TagValues.ImageIFD.DateTime] = exifDate
  }

  const exifBytes = dump(exifObj)
  const newBinary = insert(exifBytes, binaryStr)

  fs.writeFileSync(filePath, Buffer.from(newBinary, 'binary'))
}

function hasExifTag(exif: IExif['Exif'], tag: number): boolean {
  return Object.prototype.hasOwnProperty.call(exif, tag)
}
