import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash, randomUUID } from "crypto";
import formidable from "formidable";
import { updateDatetimes } from "./updateDatetimes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.join(__dirname, "..", "uploads");
const processedRoot = path.join(__dirname, "..", "processed");
const publicDir = path.join(__dirname, "..", "public");
const batchMeta = new Map<string, { expiresAt: number; passwordHash?: string }>();
const downloadTokens = new Map<string, { filePath: string; batchId: string }>();

fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(processedRoot, { recursive: true });

const fileTtlMinutes = Number(process.env.FILE_TTL_MINUTES ?? 30);
const cleanupIntervalMs = Number(process.env.FILE_CLEANUP_INTERVAL_MS ?? 5 * 60 * 1000);

cleanupOldDirsOnStartup().catch((error) => {
  console.error("Startup cleanup failed:", error);
});
startCleanup();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(publicDir));

app.post("/process", async (req, res) => {
  const batchId = `${Date.now()}-${randomUUID()}`;
  const batchUploadDir = path.join(uploadRoot, batchId);
  const batchProcessedDir = path.join(processedRoot, batchId);

  fs.mkdirSync(batchUploadDir, { recursive: true });
  fs.mkdirSync(batchProcessedDir, { recursive: true });

  const form = formidable({
    multiples: true,
    uploadDir: batchUploadDir,
    keepExtensions: true,
  });

  try {
    const { fields, files } = await parseForm(req, form);
    const datetime = String(fields.datetime ?? "");
    const filenameFormat = String(fields.filenameFormat ?? "[YYYY][MM][DD][HH][mm][ss]");
    const password = String(fields.password ?? "").trim();
    const uploaded = files.files;

    if (!uploaded) {
      return res.status(400).send("No files uploaded.");
    }

    const fileArray = Array.isArray(uploaded) ? uploaded : [uploaded];
    if (fileArray.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    if (!datetime) {
      return res.status(400).send("Please specify a datetime.");
    }

    const results = [] as Array<{ originalName: string; outputName: string; token: string; passwordProtected: boolean }>;
    const dateObj = new Date(datetime);
    const expiresAtMs = Date.now() + fileTtlMinutes * 60 * 1000;
    const passwordHash = password ? hashPassword(password) : undefined;
    batchMeta.set(batchId, { expiresAt: expiresAtMs, passwordHash });

    for (const file of fileArray) {
      const inputPath = String((file as any).filepath ?? (file as any).path ?? "");
      if (!inputPath) {
        throw new Error("Uploaded file path not found.");
      }

      const originalName = String((file as any).originalFilename ?? (file as any).name ?? "unknown.jpg");
      const outputName = formatFilename(filenameFormat, dateObj, originalName);
      const outputPath = path.join(batchProcessedDir, outputName);
      const token = randomUUID();

      await fs.promises.rename(inputPath, outputPath);
      updateDatetimes(outputPath, datetime);
      downloadTokens.set(token, { filePath: outputPath, batchId });

      results.push({ originalName, outputName, token, passwordProtected: Boolean(passwordHash) });
    }

    const expiresAt = new Date(expiresAtMs).toLocaleString("ja-JP", {
      hour12: false,
    });
    const resultHtml = results
      .map((item) => {
        const extra = item.passwordProtected ? ' data-password-protected="true"' : "";
        const label = escapeHtml(item.originalName) + (item.passwordProtected ? " (password protected)" : "");
        return `<li><a href="#" data-token="${encodeURIComponent(item.token)}" target="_blank"${extra}>${label}</a></li>`;
      })
      .join("\n");

    res.send(`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JPG Date Updater</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main>
      <h1>JPG Date Updater</h1>
      <p>Updated ${results.length} file(s). Click to download the processed file(s).</p>
      <p>Expires at: ${escapeHtml(expiresAt)}</p>
      <ul>
        ${resultHtml}
      </ul>
      <p><a class="button" href="/">Back</a></p>
    </main>
    <script>
      function submitDownload(token, password) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = '/download/' + token;
        form.target = "_blank";

        const pwInput = document.createElement("input");
        pwInput.type = "hidden";
        pwInput.name = "pw";
        pwInput.value = password ?? "";
        form.appendChild(pwInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }

      document.querySelectorAll("a[data-token]").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          const token = link.dataset.token;
          if (!token) return;

          if (link.dataset.passwordProtected === "true") {
            const pw = prompt("Passwordを入力してください");
            if (pw === null) return;
            submitDownload(token, pw);
          } else {
            submitDownload(token, "");
          }
        });
      });
    </script>
  </body>
</html>`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to process files.");
  }
});

app.post("/download/:token", async (req, res) => {
  const { token } = req.params;
  const tokenInfo = downloadTokens.get(token);

  if (!tokenInfo) {
    return res.status(404).send("File not found.");
  }

  const batchInfo = batchMeta.get(tokenInfo.batchId);
  if (!batchInfo || batchInfo.expiresAt < Date.now()) {
    downloadTokens.delete(token);
    if (tokenInfo.batchId) {
      batchMeta.delete(tokenInfo.batchId);
      await cleanupBatchDirs(tokenInfo.batchId);
    }
    return res.status(404).send("File not found.");
  }

  const password = String(req.body.pw ?? "");
  if (batchInfo.passwordHash) {
    if (!password || hashPassword(password) !== batchInfo.passwordHash) {
      return res.status(403).send("Password required or incorrect.");
    }
  }

  try {
    await fs.promises.access(tokenInfo.filePath, fs.constants.R_OK);
    const filename = path.basename(tokenInfo.filePath);
    res.download(tokenInfo.filePath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error("Download failed:", err);
        res.status(404).send("File not found.");
      }
    });
  } catch (error) {
    console.error("Download access failed:", error);
    res.status(404).send("File not found.");
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

function parseForm(req: express.Request, form: any) {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function formatFilename(format: string, date: Date, originalName: string): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const sss = pad(date.getMilliseconds(), 3);

  let result = format
    .replaceAll('[YYYY]', String(yyyy))
    .replaceAll('[MM]', mm)
    .replaceAll('[DD]', dd)
    .replaceAll('[HH]', hh)
    .replaceAll('[mm]', min)
    .replaceAll('[ss]', ss)
    .replaceAll('[SSS]', sss)
    .replaceAll('[original]', removeExtension(originalName));

  if (!result.endsWith(".jpg") && !result.endsWith(".jpeg")) {
    result += ".jpg";
  }

  return result;
}

function removeExtension(filename: string): string {
  return filename.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, "");
}

async function cleanupOldDirsOnStartup() {
  await cleanupDirs(uploadRoot);
  await cleanupDirs(processedRoot);
}

function startCleanup() {
  setInterval(async () => {
    try {
      await cleanupExpiredBatches();
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }, cleanupIntervalMs);
}

async function cleanupExpiredBatches() {
  const now = Date.now();
  const expiredBatchIds: string[] = [];

  for (const [batchId, batchInfo] of batchMeta.entries()) {
    if (batchInfo.expiresAt < now) {
      expiredBatchIds.push(batchId);
      batchMeta.delete(batchId);
    }
  }

  for (const [token, info] of downloadTokens.entries()) {
    if (!batchMeta.has(info.batchId)) {
      downloadTokens.delete(token);
    }
  }

  await Promise.all(
    expiredBatchIds.map(async (batchId) => await cleanupBatchDirs(batchId))
  );
}

async function cleanupBatchDirs(batchId: string) {
  const batchUploadDir = path.join(uploadRoot, batchId);
  const batchProcessedDir = path.join(processedRoot, batchId);

  await Promise.all([
    fs.promises.rm(batchUploadDir, { recursive: true, force: true }),
    fs.promises.rm(batchProcessedDir, { recursive: true, force: true }),
  ]);
}

async function cleanupDirs(root: string) {
  const ttlMs = fileTtlMinutes * 60 * 1000;
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  const now = Date.now();

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dirPath = path.join(root, entry.name);
        const createdAtMs = parseBatchTimestamp(entry.name, dirPath);
        if (createdAtMs === 0) {
          return;
        }

        if (now - createdAtMs > ttlMs) {
          await fs.promises.rm(dirPath, { recursive: true, force: true });
        }
      })
  );
}

function parseBatchTimestamp(batchName: string, dirPath: string) {
  const match = batchName.match(/^(\d+)-/);
  if (match) {
    const parsed = Number(match[1]);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  try {
    return fs.statSync(dirPath).birthtimeMs;
  } catch {
    return 0;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
