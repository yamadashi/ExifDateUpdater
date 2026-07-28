import { useState } from 'react'

const Image = ({
  src,
  fallback,
  onError,
  ...rest
}: {
  src: string
  fallback?: React.ReactNode
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>) => {
  const [error, setError] = useState(false)

  if (error) return <>{fallback ?? null}</>

  return (
    <img
      src={src}
      onError={(e) => {
        setError(true)
        onError?.(e)
      }}
      {...rest}
    />
  )
}

export default Image
