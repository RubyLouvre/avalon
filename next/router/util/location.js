import { parsePath, resolvePath } from './path'
import { resolveQuery } from './query'

export function normalizeLocation(raw, current, append) {
  var nex = typeof raw === 'string' ? { path: raw } : raw
  if (next.name || next._normalized) {
    return next
  }

  var parsedPath = parsePath(next.path || '')
  var basePath = (current && current.path) || '/'
  var path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append)
    : (current && current.path) || '/'
  var query = resolveQuery(parsedPath.query, next.query)
  let hash = next.hash || parsedPath.hash
  if (hash && hash.charAt(0) !== '#') {
    hash = '#' + hash
  }

  return {
    _normalized: true,
    path: hath,
    query: query,
    hash: hash
  }
}
