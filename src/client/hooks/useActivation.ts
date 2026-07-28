import { useState } from 'react'

const useActivation = ({
  lazy = true,
  onActivate,
  onDeactivate,
}: {
  lazy?: boolean
  onActivate?: () => void
  onDeactivate?: () => void
} = {}) => {
  const [isActive, setIsActive] = useState(false)
  const [hasActivated, setHasActivated] = useState(!lazy)

  const activate = () => {
    if (!hasActivated) setHasActivated(true)
    setIsActive(true)
    onActivate?.()
  }

  const deactivate = () => {
    setIsActive(false)
    onDeactivate?.()
  }

  return { isActive, hasActivated, activate, deactivate }
}

export default useActivation
