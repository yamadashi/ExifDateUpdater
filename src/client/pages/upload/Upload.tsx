import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import Layout, { Content, Header } from '@layouts/Layout'
import FileInput from '@components/molecules/file.molecule'
import DatetimeInput, {
  DEFAULT_FORMAT as DEFAULT_DATE_FORMAT,
} from '@components/atoms/datetime.atom'

import Textfield from '@components/atoms/textfield.atom'
import Button from '@components/atoms/button/button.atom'
import { createSlotComponent, getSlot } from '@utils/Slot'
import { css } from '@emotion/react'
import { submitUpload } from './bridge'

const EXIF_TIMEZONE_OFFSET_STORAGE_KEY = 'upload.exifTimezoneOffset'
const FILENAME_TIMEZONE_OFFSET_STORAGE_KEY = 'upload.filenameTimezoneOffset'
const OUTPUT_FILENAME_FORMAT_STORAGE_KEY = 'upload.outputFilenameFormat'

const readStoredOffset = (key: string): number => {
  const stored = localStorage.getItem(key)
  const parsed = stored === null ? NaN : Number(stored)
  return Number.isFinite(parsed) ? parsed : 0
}

const Label = createSlotComponent()
const Field = createSlotComponent()
const Description = createSlotComponent()
const Error = createSlotComponent()

const DEFAULT_OUTPUT_FILENAME_FORMAT = '[YYYY][MM][DD][HH][mm][ss]'

const buildFilenamePreview = (
  format: string,
  date: dayjs.Dayjs,
  originalName: string,
): string => {
  const original = originalName.replace(/\.(jpg|jpeg)$/i, '')
  let result = format
    .replaceAll('[YYYY]', date.format('YYYY'))
    .replaceAll('[MM]', date.format('MM'))
    .replaceAll('[DD]', date.format('DD'))
    .replaceAll('[HH]', date.format('HH'))
    .replaceAll('[mm]', date.format('mm'))
    .replaceAll('[ss]', date.format('ss'))
    .replaceAll('[SSS]', date.format('SSS'))
    .replaceAll('[original]', original)
  if (!result.match(/\.(jpg|jpeg)$/i)) result += '.jpg'
  return result
}

const FormItem: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const label = getSlot(children, Label)
  const field = getSlot(children, Field)
  const description = getSlot(children, Description)
  const error = getSlot(children, Error)

  return (
    <div css={css({ '& > * ~ *': { marginTop: '8px' } })}>
      {label && <span>{label}</span>}
      <div css={css({ marginLeft: '16px', '& > * ~ *': { marginTop: '4px' } })}>
        {field}
        {error && (
          <div>
            <small role="alert" css={css({ color: 'red' })}>
              {error}
            </small>
          </div>
        )}
        {description && (
          <div>
            <small>{description}</small>
          </div>
        )}
      </div>
    </div>
  )
}

const Upload: React.FC = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileList | null>(null)
  const [datetime, setDatetime] = useState('')
  const [outputFilenameFormat, setOutputFilenameFormat] = useState(
    () =>
      localStorage.getItem(OUTPUT_FILENAME_FORMAT_STORAGE_KEY) ||
      DEFAULT_OUTPUT_FILENAME_FORMAT,
  )
  const [password, setPassword] = useState('')
  const [exifTimezoneOffset, setExifTimezoneOffset] = useState(() =>
    readStoredOffset(EXIF_TIMEZONE_OFFSET_STORAGE_KEY),
  )
  const [filenameTimezoneOffset, setFilenameTimezoneOffset] = useState(() =>
    readStoredOffset(FILENAME_TIMEZONE_OFFSET_STORAGE_KEY),
  )
  const [fileOverrides, setFileOverrides] = useState<Map<File, string>>(
    new Map(),
  )

  useEffect(() => {
    localStorage.setItem(
      OUTPUT_FILENAME_FORMAT_STORAGE_KEY,
      outputFilenameFormat,
    )
  }, [outputFilenameFormat])

  useEffect(() => {
    localStorage.setItem(
      EXIF_TIMEZONE_OFFSET_STORAGE_KEY,
      String(exifTimezoneOffset),
    )
  }, [exifTimezoneOffset])

  useEffect(() => {
    localStorage.setItem(
      FILENAME_TIMEZONE_OFFSET_STORAGE_KEY,
      String(filenameTimezoneOffset),
    )
  }, [filenameTimezoneOffset])

  const toggleFileOverride = (file: File) => {
    setFileOverrides((prev) => {
      const next = new Map(prev)
      if (next.has(file)) {
        next.delete(file)
      } else {
        next.set(file, datetime)
      }
      return next
    })
  }

  const setFileOverrideValue = (file: File, value: string) => {
    setFileOverrides((prev) => new Map(prev).set(file, value))
  }

  useEffect(() => {
    const currentFiles = new Set(files ? Array.from(files) : [])
    setFileOverrides((prev) => {
      const next = new Map(
        Array.from(prev).filter(([file]) => currentFiles.has(file)),
      )
      return next.size === prev.size ? prev : next
    })
  }, [files])

  const renderFileExtra = (file: File) => {
    const override = fileOverrides.get(file)
    if (override === undefined) {
      return (
        <Button
          theme="none"
          size="NONE"
          style={{ color: '#2379e7', textDecoration: 'underline' }}
          onClick={() => toggleFileOverride(file)}
        >
          個別に日時を設定
        </Button>
      )
    }
    return (
      <div
        css={css({
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        })}
      >
        <DatetimeInput
          value={override}
          setValue={(v) => setFileOverrideValue(file, v)}
          format={DEFAULT_DATE_FORMAT}
        />
        <Button
          theme="none"
          size="NONE"
          style={{ color: '#666', textDecoration: 'underline' }}
          onClick={() => toggleFileOverride(file)}
        >
          一括設定に戻す
        </Button>
      </div>
    )
  }

  const previewBase = useMemo(() => {
    if (!datetime || !dayjs(datetime, DEFAULT_DATE_FORMAT, true).isValid())
      return null
    return dayjs(datetime)
  }, [datetime])

  const previewExifDate = useMemo(() => {
    if (!previewBase) return null
    return previewBase
      .add(exifTimezoneOffset, 'hour')
      .format('YYYY:MM:DD HH:mm:ss')
  }, [previewBase, exifTimezoneOffset])

  const previewFilename = useMemo(() => {
    if (!previewBase) return null
    const date = previewBase.add(filenameTimezoneOffset, 'hour')
    const firstName = files
      ? (Array.from(files)[0]?.name ?? 'image.jpg')
      : 'image.jpg'
    return buildFilenamePreview(
      outputFilenameFormat || DEFAULT_OUTPUT_FILENAME_FORMAT,
      date,
      firstName,
    )
  }, [previewBase, filenameTimezoneOffset, outputFilenameFormat, files])

  type FieldError = { hasError: boolean; message: string }
  const [errors, setErrors] = useState<{
    files: FieldError
    datetime: FieldError
  }>({
    files: { hasError: false, message: '' },
    datetime: { hasError: false, message: '' },
  })

  // エラーの時trueを返す
  const validate = () => {
    const newErrors = {
      files: {
        hasError: !files?.length,
        message: 'ファイルを1つ以上選択してください。',
      },
      datetime: {
        hasError:
          !datetime || !dayjs(datetime, DEFAULT_DATE_FORMAT, true).isValid(),
        message: '正しい日時を入力してください。',
      },
    }

    setErrors(newErrors)
    return newErrors
  }

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const upload = async () => {
    const newErrors = validate()
    if (Object.values(newErrors).some((f) => f.hasError)) return

    // 補正
    if (outputFilenameFormat.trim() === '') {
      setOutputFilenameFormat(DEFAULT_OUTPUT_FILENAME_FORMAT)
    }

    // 各ファイルを固有のフィールド名 (file_<n>) で送り、
    // 個別日時はそのフィールド名をキーにして紐付ける
    const formData = new FormData()
    const fileDatetimes: Record<string, string> = {}
    Array.from(files ?? []).forEach((file, i) => {
      const key = `file_${i}`
      formData.append(key, file)
      const override = fileOverrides.get(file)
      if (override) fileDatetimes[key] = override
    })
    formData.append('datetime', datetime)
    formData.append('fileDatetimes', JSON.stringify(fileDatetimes))
    formData.append(
      'filenameFormat',
      outputFilenameFormat.trim() === ''
        ? DEFAULT_OUTPUT_FILENAME_FORMAT
        : outputFilenameFormat,
    )
    formData.append('password', password)
    formData.append('exifTimezoneOffset', String(exifTimezoneOffset))
    formData.append('filenameTimezoneOffset', String(filenameTimezoneOffset))

    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await submitUpload(formData)
      navigate(`/download/${result.batchId}`)
    } catch (e) {
      console.error(e)
      setSubmitError('アップロードに失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <Header>
        <h1>JPEG Date Updater</h1>
      </Header>
      <Content>
        <p>JPEG ファイルをアップロードして、日付情報を更新します。</p>

        <form
          css={css({
            border: '1px solid black',
            borderRadius: '20px',
            padding: '20px',
            margin: '15px',
            '& > * ~ *': { marginTop: '16px' },
          })}
          encType="multipart/form-data"
        >
          <FormItem>
            <Label>画像ファイル (複数可)：</Label>
            <Field>
              <FileInput
                files={files}
                setFiles={setFiles}
                multiple
                required
                accept=".jpg,.jpeg"
                renderFileExtra={renderFileExtra}
              />
            </Field>
            {errors.files.hasError && <Error>{errors.files.message}</Error>}
          </FormItem>

          <FormItem>
            <Label>日時：</Label>
            <Field>
              <DatetimeInput
                value={datetime}
                setValue={setDatetime}
                format={DEFAULT_DATE_FORMAT}
              />
            </Field>
            {errors.datetime.hasError && (
              <Error>{errors.datetime.message}</Error>
            )}
            <Description>日時の形式：{DEFAULT_DATE_FORMAT}</Description>
          </FormItem>

          <FormItem>
            <Label>出力ファイル名フォーマット：</Label>
            <Field>
              <Textfield
                value={outputFilenameFormat}
                onChange={setOutputFilenameFormat}
              />
            </Field>
            <Description>
              利用可能な置換フォーマット：[YYYY], [MM], [DD], [HH], [mm], [ss],
              [SSS], [original]
              <br />
              例：photo_[YYYY][MM][DD] → photo_20260525.jpg
              <br />
              デフォルト: {DEFAULT_OUTPUT_FILENAME_FORMAT}
            </Description>
          </FormItem>

          <FormItem>
            <Label>ファイル名時刻オフセット (任意)：</Label>
            <Field>
              <Textfield
                type="number"
                value={filenameTimezoneOffset}
                onChange={setFilenameTimezoneOffset}
                min={-12}
                max={14}
              />
            </Field>
            <Description>
              入力した日時を何時間ずらしてファイル名に使うか。
            </Description>
          </FormItem>

          <FormItem>
            <Label>EXIF時刻オフセット (任意)：</Label>
            <Field>
              <Textfield
                type="number"
                value={exifTimezoneOffset}
                onChange={setExifTimezoneOffset}
                min={-12}
                max={14}
              />
            </Field>
            <Description>
              入力した日時を何時間ずらしてEXIFに書き込むか。
            </Description>
          </FormItem>

          <FormItem>
            <Label>ダウンロードパスワード (任意)：</Label>
            <Field>
              <Textfield
                type="password"
                value={password}
                onChange={setPassword}
              />
            </Field>
            <Description>
              同じバッチ内のすべてのファイルに対して同じパスワードが適用されます。
            </Description>
          </FormItem>

          {(previewFilename || previewExifDate) && (
            <div
              css={css({
                borderTop: '1px solid #ddd',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              })}
            >
              <small css={css({ color: '#666' })}>プレビュー</small>
              {previewFilename && (
                <div>
                  <small>ファイル名：</small>
                  <code css={css({ marginLeft: '8px' })}>
                    {previewFilename}
                  </code>
                </div>
              )}
              {previewExifDate && (
                <div>
                  <small>EXIFデータ：</small>
                  <code css={css({ marginLeft: '8px' })}>
                    {previewExifDate}
                  </code>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <small role="alert" css={css({ color: 'red', display: 'block' })}>
              {submitError}
            </small>
          )}

          <Button size="M" onClick={upload}>
            {submitting ? '更新中...' : '更新する'}
          </Button>
        </form>
        <p className="note">処理完了後、ダウンロードリンクが表示されます。</p>
      </Content>
    </Layout>
  )
}

export default Upload
