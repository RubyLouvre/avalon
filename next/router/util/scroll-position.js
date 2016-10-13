
export function saveScrollPosition(key) {
  if (!key) return
  window.sessionStorage.setItem(key, JSON.stringify({
    x: window.pageXOffset,
    y: window.pageYOffset
  }))
}

export function getScrollPosition(key) {
  if (!key) return
  return JSON.parse(window.sessionStorage.getItem(key))
}

export function getElementPosition(el) {
  var docRect = document.documentElement.getBoundingClientRect()
  var elRect = el.getBoundingClientRect()
  return {
    x: elRect.left - docRect.left,
    y: elRect.top - docRect.top
  }
}

export function isValidPosition(obj) {
  return isNumber(obj.x + obj.y)
}

export function normalizePosition(obj) {
  return {
    x: isNumber(obj.x) ? obj.x : window.pageXOffset,
    y: isNumber(obj.y) ? obj.y : window.pageYOffset
  }
}

function isNumber(v) {
  return typeof v === 'number'
}