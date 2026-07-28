import { useCallback, useRef, useState } from 'react'

export type Placement = 'top' | 'bottom' | 'left' | 'right'

type Position = { top: number; left: number }

const calculatePosition = (
  anchorRect: DOMRect,
  contentRect: DOMRect | null,
  placement: Placement,
): Position => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cw = contentRect?.width ?? 0
  const ch = contentRect?.height ?? 0

  let top: number
  let left: number

  switch (placement) {
    case 'bottom':
      top = anchorRect.bottom
      left = anchorRect.left
      break
    case 'top':
      top = anchorRect.top - ch
      left = anchorRect.left
      break
    case 'right':
      top = anchorRect.top
      left = anchorRect.right
      break
    case 'left':
      top = anchorRect.top
      left = anchorRect.left - cw
      break
  }

  if (!contentRect) return { top, left }

  // 水平方向の overflow 補正
  if (left + cw > vw) left = vw - cw
  if (left < 0) left = 0

  // 垂直方向の overflow 補正（はみ出す場合は反対側に flip）
  if (placement === 'bottom' && top + ch > vh) {
    const flipped = anchorRect.top - ch
    top = flipped >= 0 ? flipped : top
  } else if (placement === 'top' && top < 0) {
    const flipped = anchorRect.bottom
    top = flipped + ch <= vh ? flipped : top
  } else if (placement === 'right' && left + cw > vw) {
    const flipped = anchorRect.left - cw
    left = flipped >= 0 ? flipped : left
  } else if (placement === 'left' && left < 0) {
    const flipped = anchorRect.right
    left = flipped + cw <= vw ? flipped : left
  }

  return { top, left }
}

const useAnchoredPosition = ({ placement = 'bottom' }: { placement?: Placement } = {}) => {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })
  const [isReady, setIsReady] = useState(false)
  const isReadyRef = useRef(false)

  const calculate = useCallback(
    (anchorEl: HTMLElement, contentEl?: HTMLElement | null) => {
      const anchorRect = anchorEl.getBoundingClientRect()
      const contentRect = contentEl?.getBoundingClientRect() ?? null
      setPosition(calculatePosition(anchorRect, contentRect, placement))
      if (contentEl && !isReadyRef.current) {
        isReadyRef.current = true
        setIsReady(true)
      }
    },
    [placement],
  )

  return { position, isReady, calculate }
}

export default useAnchoredPosition
