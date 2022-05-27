import React, { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

const RootPortal = ({ children, className, style }) => {
  const portalContainer = useMemo(() => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    return container
  }, [])

  useEffect(() => () => {
    portalContainer.parentNode.removeChild(portalContainer)
  }, [portalContainer])

  return createPortal(
    <div
      className={className}
      style={style}
    >
      {children}
    </div>,
    portalContainer
  )
}

export default React.memo(RootPortal)
