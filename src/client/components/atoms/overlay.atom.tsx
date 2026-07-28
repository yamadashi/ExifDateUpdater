import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import useActivation from '@hooks/useActivation'
import { useLayer } from '@hooks/useLayer'

const Overlay = ({
  children,
  open = true,
  lazy = false,
  onClose,
}: {
  children: React.ReactNode
  open?: boolean
  lazy?: boolean
  onClose?: () => void
}) => {
  const {
    zIndex,
    activate: activateLayer,
    deactivate: deactivateLayer,
    container,
  } = useLayer()
  const { isActive, hasActivated, activate, deactivate } = useActivation({
    lazy,
    onActivate: activateLayer,
    onDeactivate: deactivateLayer,
  })

  useEffect(() => {
    if (open) activate()
    else deactivate()
  }, [open])

  if (!container || !hasActivated) return null

  return createPortal(
    <div
      hidden={!isActive || zIndex === undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    container,
  )
}

export default Overlay
