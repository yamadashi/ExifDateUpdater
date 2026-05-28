import fs from "fs";
import { utimesSync } from "utimes";
import { dump, insert, load, TagValues, IExif } from "piexif-ts";

export function updateDatetimes(file: string, datetime: string) {
  const { date, subsec } = parseDateAndSubsec(datetime);

  // Exifの日時を更新
  updateExifDates(file, date, subsec);

  // ファイルシステムの日時を更新
  utimesSync(file, {
    btime: date.getTime(),
    mtime: date.getTime(),
  });
}

function updateExifDates(filePath: string, date: Date, subsec: string | null): void {
  const exifDate = formatExifDate(date);

  // JPEG ファイルを読み込み、Base64 やバイナリ文字列に変換
  const buf = fs.readFileSync(filePath);
  // Buffer を binary string に変換
  const binaryStr = buf.toString("binary");

  // Exif をロード
  const exifObj: IExif = load(binaryStr);

  // 0th IFD の DateTime
  if (exifObj["0th"]) {
    exifObj["0th"][TagValues.ImageIFD.DateTime] = exifDate;
  }

  // Exif IFD の DateTimeOriginal, DateTimeDigitized
  if (exifObj.Exif) {
    exifObj.Exif[TagValues.ExifIFD.DateTimeOriginal] = exifDate;
    exifObj.Exif[TagValues.ExifIFD.DateTimeDigitized] = exifDate;

    if (subsec !== null) {
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTime)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTime] = subsec;
      }
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTimeOriginal)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTimeOriginal] = subsec;
      }
      if (hasExifTag(exifObj.Exif, TagValues.ExifIFD.SubSecTimeDigitized)) {
        exifObj.Exif[TagValues.ExifIFD.SubSecTimeDigitized] = subsec;
      }
    }
  }

  // サムネイル（1st IFD）も日時タグがあれば
  if (exifObj["1st"] && TagValues.ImageIFD.DateTime in exifObj["1st"]) {
    exifObj["1st"][TagValues.ImageIFD.DateTime] = exifDate;
  }

  // Exif をダンプして挿入
  const exifBytes = dump(exifObj);
  const newBinary = insert(exifBytes, binaryStr);

  // 書き戻し
  fs.writeFileSync(filePath, Buffer.from(newBinary, "binary"));
}

function parseDateAndSubsec(datetime: string): { date: Date; subsec: string | null } {
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid datetime: ${datetime}`);
  }

  const match = datetime.match(/\.(\d{1,3})(?=$|[^0-9])/);
  const subsec = match ? String(match[1]).padEnd(3, "0").slice(0, 3) : null;

  return { date, subsec };
}

function hasExifTag(exif: IExif["Exif"], tag: number): boolean {
  return Object.prototype.hasOwnProperty.call(exif, tag);
}

function formatExifDate(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
