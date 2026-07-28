import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import formidable from 'formidable'
import { ZipArchive } from 'archiver'
import { updateDatetimes } from './updateDatetimes.js'
import { hashPassword, passwordMatches, formatFilename, applyTimezoneOffset } from './format.js'
import {
  isValidBatchId,
  saveBatchMeta,
  readBatchMeta,
  deleteBatchMeta,
  listBatchIds,
} from './batchStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadRoot = path.join(__dirname, '..', 'uploads')
const processedRoot = path.join(__dirname, '..', 'processed')
const metaRoot = path.join(__dirname, '..', 'meta')

fs.mkdirSync(uploadRoot, { recursive: true })
fs.mkdirSync(processedRoot, { recursive: true })
fs.mkdirSync(metaRoot, { recursive: true })

const fileTtlMinutes = Number(process.env.FILE_TTL_MINUTES ?? 30)
const cleanupIntervalMs = Number(
  process.env.FILE_CLEANUP_INTERVAL_MS ?? 5 * 60 * 1000,
)

cleanupOldDirsOnStartup().catch((error) => {
  console.error('Startup cleanup failed:', error)
})
startCleanup()

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 8080
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000'

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', clientOrigin)
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.post('/process', async (req, res) => {
  const batchId = `${Date.now()}-${randomUUID()}`
  const batchUploadDir = path.join(uploadRoot, batchId)
  const batchProcessedDir = path.join(processedRoot, batchId)

  fs.mkdirSync(batchUploadDir, { recursive: true })
  fs.mkdirSync(batchProcessedDir, { recursive: true })

  const form = formidable({
    multiples: true,
    uploadDir: batchUploadDir,
    keepExtensions: true,
  })

  try {
    const { fields, files } = await parseForm(req, form)
    const datetime = fields.datetime?.[0] ?? ''
    const filenameFormat =
      fields.filenameFormat?.[0] ?? '[YYYY][MM][DD][HH][mm][ss]'
    const password = (fields.password?.[0] ?? '').trim()
    const exifTimezoneOffset = Number(fields.exifTimezoneOffset?.[0] ?? '0') || 0
    const filenameTimezoneOffset = Number(fields.filenameTimezoneOffset?.[0] ?? '0') || 0
    const uploaded = files.files

    if (!uploaded) {
      return res.status(400).json({ error: 'No files uploaded.' })
    }

    const fileArray = uploaded
    if (fileArray.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' })
    }

    if (!datetime) {
      return res.status(400).json({ error: 'Please specify a datetime.' })
    }

    const baseDate = new Date(datetime)
    const exifDate = applyTimezoneOffset(baseDate, exifTimezoneOffset)
    const filenameDate = applyTimezoneOffset(baseDate, filenameTimezoneOffset)
    const expiresAtMs = Date.now() + fileTtlMinutes * 60 * 1000
    const passwordHash = password ? hashPassword(password) : undefined
    await saveBatchMeta(metaRoot, batchId, { expiresAt: expiresAtMs, passwordHash })

    for (const file of fileArray) {
      const inputPath = file.filepath
      const originalName = file.originalFilename ?? 'unknown.jpg'
      const outputName = formatFilename(filenameFormat, filenameDate, originalName)
      const outputPath = path.join(batchProcessedDir, outputName)

      await fs.promises.rename(inputPath, outputPath)
      updateDatetimes(outputPath, exifDate)
    }

    res.json({ batchId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to process files.' })
  }
})

app.get('/batch/:batchId', async (req, res) => {
  const { batchId } = req.params
  if (!isValidBatchId(batchId)) {
    return res.status(400).json({ error: 'Invalid batch id.' })
  }

  const batchInfo = await readBatchMeta(metaRoot, batchId)

  if (!batchInfo || batchInfo.expiresAt < Date.now()) {
    return res.status(404).json({ error: 'Batch not found.' })
  }

  res.json({
    expiresAt: batchInfo.expiresAt,
    passwordProtected: Boolean(batchInfo.passwordHash),
  })
})

app.post('/download/:batchId', async (req, res) => {
  const { batchId } = req.params
  if (!isValidBatchId(batchId)) {
    return res.status(400).json({ error: 'Invalid batch id.' })
  }

  const batchInfo = await readBatchMeta(metaRoot, batchId)

  if (!batchInfo || batchInfo.expiresAt < Date.now()) {
    await cleanupBatch(batchId)
    return res.status(404).json({ error: 'Files not found.' })
  }

  const password = String(req.body.pw ?? '')
  if (batchInfo.passwordHash) {
    if (!password || !passwordMatches(hashPassword(password), batchInfo.passwordHash)) {
      return res.status(403).json({ error: 'Password required or incorrect.' })
    }
  }

  const batchProcessedDir = path.join(processedRoot, batchId)

  let filenames: string[]
  try {
    filenames = await fs.promises.readdir(batchProcessedDir)
  } catch (error) {
    console.error('Download access failed:', error)
    return res.status(404).json({ error: 'Files not found.' })
  }

  if (filenames.length === 0) {
    return res.status(404).json({ error: 'Files not found.' })
  }

  res.attachment('images.zip')
  const archive = new ZipArchive()
  archive.on('error', (error) => {
    console.error('Zip archive failed:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to build archive.' })
    }
  })
  archive.pipe(res)
  for (const filename of filenames) {
    archive.file(path.join(batchProcessedDir, filename), { name: filename })
  }
  await archive.finalize()
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

function parseForm(
  req: express.Request,
  form: ReturnType<typeof formidable>,
) {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err)
        resolve({ fields, files })
      })
    },
  )
}

async function cleanupOldDirsOnStartup() {
  await cleanupDirs(uploadRoot)
  await cleanupDirs(processedRoot)
}

function startCleanup() {
  setInterval(async () => {
    try {
      await cleanupExpiredBatches()
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }, cleanupIntervalMs)
}

async function cleanupExpiredBatches() {
  const now = Date.now()
  const batchIds = await listBatchIds(metaRoot)

  await Promise.all(
    batchIds.map(async (batchId) => {
      const meta = await readBatchMeta(metaRoot, batchId)
      if (!meta || meta.expiresAt < now) {
        await cleanupBatch(batchId)
      }
    }),
  )
}

async function cleanupBatch(batchId: string) {
  const batchUploadDir = path.join(uploadRoot, batchId)
  const batchProcessedDir = path.join(processedRoot, batchId)

  await Promise.all([
    fs.promises.rm(batchUploadDir, { recursive: true, force: true }),
    fs.promises.rm(batchProcessedDir, { recursive: true, force: true }),
    deleteBatchMeta(metaRoot, batchId),
  ])
}

async function cleanupDirs(root: string) {
  const ttlMs = fileTtlMinutes * 60 * 1000
  const entries = await fs.promises.readdir(root, { withFileTypes: true })
  const now = Date.now()

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dirPath = path.join(root, entry.name)
        const createdAtMs = parseBatchTimestamp(entry.name, dirPath)
        if (createdAtMs === 0) {
          return
        }

        if (now - createdAtMs > ttlMs) {
          await fs.promises.rm(dirPath, { recursive: true, force: true })
        }
      }),
  )
}

function parseBatchTimestamp(batchName: string, dirPath: string) {
  const match = batchName.match(/^(\d+)-/)
  if (match) {
    const parsed = Number(match[1])
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  try {
    return fs.statSync(dirPath).birthtimeMs
  } catch {
    return 0
  }
}
