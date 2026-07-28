import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { createSlotComponent, getSlot } from '@utils/Slot'
import useActivation from '@hooks/useActivation'
import { useLayer } from '@hooks/useLayer'
import useAnchoredPosition, { type Placement } from '@hooks/useAnchoredPosition'

export const Activator =
  createSlotComponent<(props: { onClick: () => void }) => ReactNode>()
export const Content = createSlotComponent()

const Menu = ({
  children,
  lazy = true,
  placement = 'bottom',
}: {
  children: ReactNode
  lazy?: boolean
  placement?: Placement
}) => {
  const activatorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { zIndex, activate: activateLayer, deactivate: deactivateLayer, container } = useLayer()
  const { isActive, hasActivated, activate, deactivate } = useActivation({
    lazy,
    onActivate: activateLayer,
    onDeactivate: deactivateLayer,
  })
  const { position, isReady, calculate } = useAnchoredPosition({ placement })

  const activatorContent = getSlot(children, Activator)
  const menuContent = getSlot(children, Content)

  useEffect(() => {
    if (isActive && activatorRef.current && contentRef.current) {
      calculate(activatorRef.current, contentRef.current)
    }
  }, [isActive])

  const handleOpen = () => {
    if (activatorRef.current) {
      calculate(activatorRef.current, contentRef.current)
    }
    activate()
  }

  return (
    <>
      <div ref={activatorRef} style={{ display: 'inline-block' }}>
        {typeof activatorContent === 'function'
          ? activatorContent({ onClick: handleOpen })
          : activatorContent}
      </div>
      {container &&
        createPortal(
          <>
            {isActive && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex }}
                onClick={deactivate}
              />
            )}
            {hasActivated && (
              <div
                ref={contentRef}
                style={{
                  position: 'fixed',
                  top: position.top,
                  left: position.left,
                  zIndex: zIndex ? zIndex + 1 : undefined,
                  backgroundColor: 'white',
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  ...(!isActive || zIndex === undefined || !isReady
                    ? { visibility: 'hidden', pointerEvents: 'none' }
                    : undefined),
                }}
              >
                {menuContent}
              </div>
            )}
          </>,
          container,
        )}
    </>
  )
}

export default Menu
