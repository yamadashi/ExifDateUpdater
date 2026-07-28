import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const BASE_Z_INDEX = 1000

type LayerContextValue = {
  activate: () => number
  deactivate: () => void
  container: HTMLElement | null
}

const LayerContext = createContext<LayerContextValue>({
  activate: () => BASE_Z_INDEX,
  deactivate: () => {},
  container: null,
})

export const LayerProvider = ({ children }: { children: React.ReactNode }) => {
  const counterRef = useRef(0)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const el = document.createElement('div')
    el.id = 'layer-root'
    document.body.appendChild(el)
    setContainer(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [])

  const activate = useCallback(() => {
    return BASE_Z_INDEX + ++counterRef.current
  }, [])

  const deactivate = useCallback(() => {
    --counterRef.current
  }, [])

  return (
    <LayerContext.Provider value={{ activate, deactivate, container }}>
      {children}
    </LayerContext.Provider>
  )
}

export const useLayer = () => {
  const {
    activate: activateContext,
    deactivate: deactivateContext,
    container,
  } = useContext(LayerContext)
  const [zIndex, setZIndex] = useState<number | null>(null)
  const isActiveRef = useRef(false)

  const activate = useCallback(() => {
    if (isActiveRef.current) return
    isActiveRef.current = true
    setZIndex(activateContext())
  }, [activateContext])

  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return
    isActiveRef.current = false
    deactivateContext()
    setZIndex(null)
  }, [deactivateContext])

  useEffect(() => {
    return () => {
      if (isActiveRef.current) deactivateContext()
    }
  }, [])

  return {
    zIndex: useMemo(() => zIndex ?? undefined, [zIndex]),
    activate,
    deactivate,
    container,
  }
}
