import React, { useMemo, useState } from 'react'
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
    DEFAULT_OUTPUT_FILENAME_FORMAT,
  )
  const [password, setPassword] = useState('')
  const [exifTimezoneOffset, setExifTimezoneOffset] = useState(0)
  const [filenameTimezoneOffset, setFilenameTimezoneOffset] = useState(0)

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

    const formData = new FormData()
    Array.from(files ?? []).forEach((file) => formData.append('files', file))
    formData.append('datetime', datetime)
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
