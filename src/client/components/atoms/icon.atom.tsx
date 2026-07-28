import MdiIcon from '@mdi/react'
import { css } from '@emotion/react'

const Icon = ({
  path,
  size = 1,
  color = 'currentColor',
  onClick,
  title,
  ...rest
}: {
  path: string
  size?: number | string
  color?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  title?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'color'>) => {
  if (onClick) {
    return (
      <button
        type="button"
        css={css({
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: '50%',
          color,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
        })}
        onClick={onClick}
        {...rest}
      >
        <MdiIcon path={path} size={size} title={title} />
      </button>
    )
  }

  return <MdiIcon path={path} size={size} color={color} title={title} />
}

export default Icon
