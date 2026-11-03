import { useRef, useState } from 'react'
import { css } from '@emotion/react'
import { mdiClose } from '@mdi/js'
import Icon from '@components/atoms/icon.atom'
import Image from '@components/atoms/image.atom'
import Overlay from '@components/atoms/overlay.atom'

const File = ({
  files,
  setFiles,
  readonly = false,
  onChange,
  renderFileExtra,
  ...rest
}: {
  files?: FileList | null
  setFiles?: (files: FileList | null) => void
  readonly?: boolean
  onChange?: (v: FileList | null) => void
  renderFileExtra?: (file: File, index: number) => React.ReactNode
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const handleRemove = (index: number) => {
    if (!files) return
    const dt = new DataTransfer()
    Array.from(files)
      .filter((_, i) => i !== index)
      .forEach((f) => dt.items.add(f))
    setFiles?.(dt.files.length > 0 ? dt.files : null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const renderFileInput = () => {
    if (readonly) return null
    if (files && files.length > 0 && !rest.multiple) return null
    return (
      <div>
        <input
          ref={inputRef}
          type="file"
          hidden
          {...rest}
          onChange={(e) => {
            setFiles?.(e.target.files)
            onChange?.(e.target.files)
          }}
        />
        <button type="button" onClick={() => inputRef.current?.click()}>
          ファイルを選択
        </button>
      </div>
    )
  }

  const renderFileList = () => {
    if (!files || files.length === 0)
      return <span>ファイルが選択されていません</span>
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        {Array.from(files).map((file, i) => {
          const isImage = file.type.startsWith('image/')
          const src = isImage ? URL.createObjectURL(file) : undefined
          return (
            <div
              key={i}
              style={{
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isImage && src && (
                  <Image
                    src={src}
                    alt={file.name}
                    fallback={<span>読み込み失敗</span>}
                    style={{
                      maxWidth: 120,
                      maxHeight: 100,
                      objectFit: 'contain',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewSrc(src)}
                  />
                )}
                <span>{file.name}</span>
                {!readonly && (
                  <Icon
                    path={mdiClose}
                    size={0.8}
                    onClick={() => handleRemove(i)}
                    title="削除"
                  />
                )}
              </div>
              {!readonly && renderFileExtra?.(file, i)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div css={css({'& > * ~ *': { marginTop: '8px' }})}>
      {renderFileInput()}
      {renderFileList()}
      {previewSrc && (
        <Overlay onClose={() => setPreviewSrc(null)}>
          <Image
            src={previewSrc}
            alt="preview"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
            }}
          />
        </Overlay>
      )}
    </div>
  )
}

export default File
