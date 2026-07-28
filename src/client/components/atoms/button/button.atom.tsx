import React from 'react'
import { css } from '@emotion/react'
import { CSSInterpolation } from '@emotion/serialize'

type Theme = 'primary' | 'secondary' | 'normal' | 'none'
type Size = 'L' | 'M' | 'S' | 'NONE'

const themeStyles: Record<Theme, CSSInterpolation> = {
  primary: {
    backgroundColor: '#2379e7',
    color: 'white',
    border: '1px solid #2351e7',
    '&:hover': {
      backgroundColor: '#86a2fd',
      border: '1px solid #86a2fd',
    },
  },
  secondary: {
    backgroundColor: 'white',
    color: '#2379e7',
    border: '1px solid #2379e7',
    '&:hover': {
      backgroundColor: '#d7e0ff',
    },
  },
  normal: {},
  none: {},
}

const sizeStyles: Record<Size, CSSInterpolation> = {
  L: { height: '38px', minWidth: '150px' },
  M: { height: '34px', minWidth: '100px' },
  S: { height: '30px', minWidth: '70px' },
  NONE: {},
}

const Button: React.FC<{
  children: React.ReactElement | React.ReactElement[] | string
  theme?: Theme
  size?: Size
  style?: CSSInterpolation
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}> = ({ children, theme = 'primary', size = 'M', style = {}, onClick }) => {
  return (
    <>
      <button
        type="button"
        css={css(
          { borderRadius: '5px', cursor: 'pointer' },
          themeStyles[theme],
          sizeStyles[size],
          style,
        )}
        onClick={onClick}
      >
        {children}
      </button>
    </>
  )
}

export default Button
