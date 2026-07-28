import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout, { Content, Header } from '@layouts/Layout'
import Textfield from '@components/atoms/textfield.atom'
import Button from '@components/atoms/button/button.atom'
import { css } from '@emotion/react'
import { getBatchInfo, requestDownloadUrl } from './bridge'
import type { BatchInfo } from '@services/batch/service'

const Download: React.FC = () => {
  const navigate = useNavigate()
  const { batchId } = useParams<{ batchId: string }>()

  const [batch, setBatch] = useState<BatchInfo | null>(null)
  const [batchError, setBatchError] = useState(false)

  const [password, setPassword] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const downloadUrlRef = useRef(downloadUrl)
  downloadUrlRef.current = downloadUrl
  const anchorRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (downloadUrl) {
      anchorRef.current?.click()
    }
  }, [downloadUrl])

  useEffect(() => {
    if (!batchId) {
      setBatchError(true)
      return
    }
    getBatchInfo(batchId)
      .then(setBatch)
      .catch(() => setBatchError(true))
  }, [batchId])

  if (batchError) {
    return (
      <Layout>
        <Content>
          <p>ダウンロード対象のファイルが見つかりません。有効期限が切れている可能性があります。</p>
          <Button size="M" onClick={() => navigate('/upload')}>
            アップロード画面に戻る
          </Button>
        </Content>
      </Layout>
    )
  }

  if (!batch) {
    return (
      <Layout>
        <Content>
          <p>読み込み中...</p>
        </Content>
      </Layout>
    )
  }

  const expiresAtLabel = new Date(batch.expiresAt).toLocaleString('ja-JP', {
    hour12: false,
  })

  const handlePrepareDownload = async () => {
    if (!batchId) return
    setError('')
    setLoading(true)
    try {
      const url = await requestDownloadUrl(
        batchId,
        batch.passwordProtected ? password : '',
      )
      setDownloadUrl(url)
    } catch {
      setError('ダウンロードに失敗しました。パスワードをご確認ください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Header>
        <h1>ダウンロード</h1>
      </Header>
      <Content>
        <p>ファイルの更新が完了しました。</p>
        <p>有効期限: {expiresAtLabel}</p>

        {!downloadUrl && (
          <div
            css={css({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '8px',
            })}
          >
            {batch.passwordProtected && (
              <Textfield
                type="password"
                placeholder="ダウンロードパスワード"
                value={password}
                onChange={setPassword}
              />
            )}
            {error && (
              <small role="alert" css={css({ color: 'red' })}>
                {error}
              </small>
            )}
            <Button size="M" onClick={handlePrepareDownload}>
              {loading ? '準備中...' : 'ダウンロード'}
            </Button>
          </div>
        )}

        {downloadUrl && (
          <p>
            <a ref={anchorRef} href={downloadUrl} download="images.zip">
              images.zip をダウンロード
            </a>
            <small css={css({ display: 'block', color: '#666' })}>
              自動でダウンロードが始まらない場合はこちらのリンクをクリックしてください。
            </small>
          </p>
        )}

        <p css={css({ marginTop: '24px' })}>
          <Button size="M" theme="secondary" onClick={() => navigate('/upload')}>
            アップロード画面に戻る
          </Button>
        </p>
      </Content>
    </Layout>
  )
}

export default Download
