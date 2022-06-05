import { once, reduce } from 'ramda'

const PREFIX = 'CYPHR'

const mapToKeyValue = (obj, key) => {
  obj[key] = PREFIX + '_' + key
  return obj
}

export const canUseDOM = once(() => !!(
  typeof window !== 'undefined'
    && window.document
    && window.document.createElement
))

export const canUseNotification = once(() => (
  canUseDOM()
    && 'Notification' in window
    && 'serviceWorker' in navigator
))

export const canUseUserMedia = once(() => (
  canUseDOM()
    && 'MediaRecorder' in window
    && MediaRecorder.isTypeSupported('audio/webm')
    && 'mediaDevices' in navigator
    && !!navigator.mediaDevices?.getUserMedia
))

const getEnv = () => (
  canUseDOM()
    ? window.env
    : process.env
) || {}

export const getAppUrl = (pathname) => {
  const domain = getEnv().APP_DOMAIN
  return domain
    ? `${domain}${pathname}`
    : pathname
}

export const getGunUrl = (pathname) => {
  const domain = getEnv().GUN_DOMAIN
  return domain
    ? `${domain}${pathname}`
    : pathname
}

export const getImageUrl = (pathname) => {
  const env = getEnv()
  const cdn = env.IMAGES_CDN_DOMAIN
  return cdn
    ? `${cdn}${pathname}`
    : `/static/images${pathname}`
}

export const getStaticUrl = (pathname) => {
  const cdn = getEnv().STATIC_CDN_DOMAIN
  return cdn
    ? `${cdn}${pathname}`
    : `/static${pathname}`
}

export const jsonParse = (json, defaultValue = {}) => {
  try {
    return JSON.parse(json)
  } catch (e) {
    return defaultValue
  }
}

export const getLocalStorage = () => {
  try {
    return (typeof Storage !== 'undefined' && window.localStorage)
      ? window.localStorage
      : {}
  } catch (e) {
    return {}
  }
}

export default {
  canUseDOM,
  jsonParse,
  getLocalStorage,

  // map an array of strings to
  // object keys and prefixed values.
  createObjOfConsts: reduce(
    mapToKeyValue, {},
  ),
}
