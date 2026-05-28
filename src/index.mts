import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";
import process from "process";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { updateDatetimes } from "./updateDatetimes.js";

dayjs.extend(utc);
dayjs.extend(timezone);

interface CLIArgsBase {
  datetime: string;
}

interface FilePathsArgs extends CLIArgsBase {
  "file-paths": string[];
  directory?: undefined;
}

interface DirectoryArgs extends CLIArgsBase {
  directory: string;
  r: boolean;
  "file-paths"?: undefined;
}

type CLIArgs = FilePathsArgs | DirectoryArgs;

const options = {
  datetime: {
    type: "string",
    describe: "datetime value",
    demandOption: true,
  },
  "file-paths": {
    type: "string",
    array: true, // 可変長で受け取る
    describe: "one or more file paths",
  },
  directory: {
    type: "string",
    describe: "directory path",
  },
  r: {
    type: "boolean",
    describe: "recursively list files in subdirectories",
    default: false,
  },
} as const;

function rename(file: string, datetime: dayjs.Dayjs): string {
  const utcDatetime = datetime.tz("utc");
  const newName = `PXL_${utcDatetime.format("YYYYMMDD_HHmmssSSS")}.jpg`;
  const dir = path.dirname(file);
  const newPath = `${dir}/${newName}`;
  fs.renameSync(file, newPath);
  return newPath;
}

function main() {
  const args = yargs(hideBin(process.argv))
    .options(options)
    .check((argv) => {
      if (
        (argv["file-paths"] && argv.directory) ||
        (!argv["file-paths"] && !argv.directory)
      ) {
        throw new Error(
          "You must specify either --file-paths or --directory, but not both"
        );
      }

      // -r は directory 指定時のみ有効
      if (argv.r && !argv.directory) {
        throw new Error(
          "-r option is only valid when --directory is specified"
        );
      }

      return true;
    })
    .parseSync() as CLIArgs;

  // ディレクトリ指定の場合は全ファイルを取得して file-paths と同じ構造にする
  let filePaths: string[] = [];

  if ("file-paths" in args && args["file-paths"]) {
    filePaths = args["file-paths"];
  } else if ("directory" in args && args.directory) {
    filePaths = getFilesInDirectory(args.directory, args.r);
  } else {
    throw new Error(
      "You must specify either --file-paths or --directory, but not both"
    );
  }

  const jpgFiles = filePaths.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".jpg" || ext === ".jpeg";
  });

  if (jpgFiles.length === 0) {
    console.log("There is no jpg targets.");
    return;
  }

  const datetime = dayjs(args.datetime);
  if (!datetime.isValid()) throw new Error("datetime format is invalid.");

  filePaths.forEach((file) => {
    const newPath = rename(file, datetime);
    updateDatetimes(newPath, datetime.format("YYYY/MM/DD HH:mm:ss"));
  });
}

// 再帰的にディレクトリ内のすべてのファイルを取得する関数
function getFilesInDirectory(dir: string, recursive: boolean): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      files.push(fullPath);
    } else if (entry.isDirectory() && recursive) {
      files.push(...getFilesInDirectory(fullPath, true));
    }
  }

  return files;
}

main();
