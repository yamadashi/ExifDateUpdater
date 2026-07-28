import React from 'react'
import { css } from '@emotion/react'
import type { SerializedStyles } from '@emotion/utils'
import { createSlotComponent, getSlot } from '@utils/Slot.jsx'

export const Header = createSlotComponent()
export const Content = createSlotComponent()
export const Footer = createSlotComponent()

const Root: React.FC<{
  children: React.ReactElement | React.ReactElement[]
  rootStyle?: SerializedStyles
  headerStyle?: SerializedStyles
  contentStyle?: SerializedStyles
  footerStyle?: SerializedStyles
}> = ({
  children,
  rootStyle = defaultRootStyle,
  headerStyle = defaultHeaderStyle,
  contentStyle = defaultContentStyle,
  footerStyle = defaultFooterStyle,
}) => {
  const header = getSlot(children, Header)
  const content = getSlot(children, Content)
  const footer = getSlot(children, Footer)

  return (
    <div className="layout" css={rootStyle}>
      {header && <header css={headerStyle}>{header}</header>}
      {content && (
        <main className="main-content" css={contentStyle}>
          {content}
        </main>
      )}
      {footer && <footer css={footerStyle}>{footer}</footer>}
    </div>
  )
}

export const defaultRootStyle = css({
  height: '100%',
  width: '100',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
})
export const defaultHeaderStyle = css({
  position: 'sticky',
  borderBottom: '1px solid black',
  padding: '8px',
})
export const defaultContentStyle = css({
  width: '100%',
  flexGrow: 1,
  padding: '8px',
})
export const defaultFooterStyle = css({})

export default Root
