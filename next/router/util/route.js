
import { stringifyQuery } from './query'

export function createRoute(record, location, redirectedFrom) {
  var route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query: location.query || {},
    params: location.params || {},
    fullPath: getFullPath(location),
    matched: record ? formatMatch(record) : []
  }
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom)
  }
  return route
}

function formatMatch(record) {
  var res = []
  while (record) {
    res.unshift(record)
    record = record.parent
  }
  return res
}

function getFullPath(a) {
  var path = a.path || '/'
  var query = a.query || {}
  var hash = a.hash || ''

  return (path || '/') + stringifyQuery(query) + hash
}

var trailingSlashRE = /\/$/
export function isSameRoute(a, b) {
  if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  } else {
    return false
  }
}

function isObjectEqual(a, b) {
  a = a || {}
  b = b || {}
  var aKeys = Object.keys(a)
  var bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(function (key) {
    return String(a[key]) === String(b[key])
  })
}

export function isIncludedRoute(current, target) {
  return (
    current.path.indexOf(target.path) === 0 &&
    (!target.hash || current.hash === target.hash) &&
    queryIncludes(current.query, target.query)
  )
}

function queryIncludes(current, target) {
  for (const key in target) {
    if (!(key in current)) {
      return false
    }
  }
  return true
}