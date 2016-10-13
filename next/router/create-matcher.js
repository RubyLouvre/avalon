import Regexp from 'path-to-regexp'
import { createRoute } from './util/route'
import { createRouteMap } from './create-route-map'
import { resolvePath } from './util/path'
import { normalizeLocation } from './util/location'

var regexpCache = {}

var regexpCompileCache = {}

export function createMatcher (routes) {
    var obj = createRouteMap(routes)
    var pathMap = obj.pathMap
    var nameMap = obj.nameMap

  function match ( raw,currentRoute,redirectedFrom){
    var location = normalizeLocation(raw, currentRoute)
    var name = location.name

    if (name) {
      var record = nameMap[name]
      if (record) {
        location.path = fillParams(record.path, location.params, "named route "+ name)
        return _createRoute(record, location, redirectedFrom)
      }
    } else if (location.path) {
      location.params = {}
      for (var path in pathMap) {
        if (matchRoute(path, location.params, location.path)) {
          return _createRoute(pathMap[path], location, redirectedFrom)
        }
      }
    }
    // no match
    return _createRoute(null, location)
  }

  function redirect (record, location){
    var originalRedirect = record.redirect
    var redirect = typeof originalRedirect === 'function'
        ? originalRedirect(createRoute(record, location))
        : originalRedirect

    if (typeof redirect === 'string') {
      redirect = { path: redirect }
    }

    if (!redirect || typeof redirect !== 'object') {
      avalon.warn(false, "invalid redirect option: "+ JSON.stringify(redirect))
      return _createRoute(null, location)
    }

    var re = redirect
    var name = re.name
    var path = re.path
    var query = location.query
    var hash = location.hash
    var params = location.params
    //let { query, hash, params } = location
    query = re.hasOwnProperty('query') ? re.query : query
    hash = re.hasOwnProperty('hash') ? re.hash : hash
    params = re.hasOwnProperty('params') ? re.params : params

    if (name) {
      // resolved named direct
      var targetRecord = nameMap[name]
      if(!targetRecord){
          avalon.warn('redirect failed: named route ', name, 'not found.')
      }
      return match({
        _normalized: true,
        name:name,
        query:query,
        hash: hash,
        params:params
      }, undefined, location)
    } else if (path) {
      // 1. resolve relative redirect
      var rawPath = resolveRecordPath(path, record)
      // 2. resolve params
      var resolvedPath = fillParams(rawPath, params, 'redirect route with path '+ rawPath)
      // 3. rematch with existing query and hash
      return match({
        _normalized: true,
        path: resolvedPath,
        query: query,
        hash: hash
      }, undefined, location)
    } else {
        avalon.warn('invalid redirect option: '+JSON.stringify(redirect))
      //warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`)
      return _createRoute(null, location)
    }
  }

  function alias ( record,location,matchAs ) {
    var aliasedPath = fillParams(matchAs, location.params, 'aliased route with path '+matchAs)
    var aliasedMatch = match({
      _normalized: true,
      path: aliasedPath
    })
    if (aliasedMatch) {
      var matched = aliasedMatch.matched
      var aliasedRecord = matched[matched.length - 1]
      location.params = aliasedMatch.params
      return _createRoute(aliasedRecord, location)
    }
    return _createRoute(null, location)
  }

  function _createRoute (record,location, redirectedFrom) {
    if (record && record.redirect) {
      return redirect(record, redirectedFrom || location)
    }
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
    return createRoute(record, location, redirectedFrom)
  }

  return match
}

function matchRoute (path,params,pathname){
  var keys, regexp,hit = regexpCache[path]
  if (hit) {
    keys = hit.keys
    regexp = hit.regexp
  } else {
    keys = []
    regexp = Regexp(path, keys)
    regexpCache[path] = { keys:keys, regexp:regexp }
  }
  var m = pathname.match(regexp)

  if (!m) {
    return false
  } else if (!params) {
    return true
  }

  for (let i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1]
    var val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i]
    if (key) params[key.name] = val
  }

  return true
}

function fillParams (
  path: string,
  params: ?Object,
  routeMsg: string
): string {
  try {
    const filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = Regexp.compile(path))
    return filler(params || {}, { pretty: true })
  } catch (e) {
    assert(false, `missing param for ${routeMsg}: ${e.message}`)
    return ''
  }
}

function resolveRecordPath (path: string, record: RouteRecord): string {
  return resolvePath(path, record.parent ? record.parent.path : '/', true)
}
