import { inc } from 'ramda'
import { useCallback, useEffect, useState } from 'react'
import theme from '../components/theme'
import { canUseDOM } from '../utils/common-util'



export const useResponsive = () => {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (canUseDOM() && window.addEventListener) {
      // subscribe to resize event after mounting.
      const handleResize = () => forceUpdate(inc)
      window.addEventListener('resize', handleResize)

      return () => {
        // remove the listener when unmounting.
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const isBreakpointUp = useCallback((size) => {
    const { device } = theme
    const target = device[size] || device.lg
    const screenWidth = canUseDOM() ? window.innerWidth : device.lg
    return screenWidth >= target
  }, [])

  const isBreakpointDown = useCallback((size) => {
    const { device } = theme
    const target = device[size] || device.lg
    const screenWidth = canUseDOM() ? window.innerWidth : device.lg
    return screenWidth < target
  }, [])

  return {
    isBreakpointUp,
    isBreakpointDown,
  }
}
