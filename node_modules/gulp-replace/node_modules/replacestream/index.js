var through = require('through');

module.exports = ReplaceStream;
function ReplaceStream(search, replace, options) {
  var tail = '';
  var totalMatches = 0;
  var isRegex = search instanceof RegExp;

  options = options || {};
  options.limit = options.limit || Infinity;
  options.encoding = options.encoding || 'utf8';
  options.max_match_len = options.max_match_len || 100;

  if (!isRegex)
    options.regExpOptions = options.regExpOptions || 'gmi';

  var replaceFn = replace;

  replaceFn = createReplaceFn(replace, isRegex);

  var match;
  if (isRegex) {
    match = matchFromRegex(search, options)
  } else {
    match = matchFromString(search, options);
    options.max_match_len = search.length;
  }

  function write(buf) {
    var matches;
    var lastPos = 0;
    var runningMatch = '';
    var matchCount = 0;
    var rewritten = '';
    var haystack = tail + buf.toString(options.encoding);
    tail = '';

    while (totalMatches < options.limit &&
          (matches = match.exec(haystack)) !== null) {

      matchCount++;
      var before = haystack.slice(lastPos, matches.index);
      var regexMatch = matches;
      lastPos = matches.index + regexMatch[0].length;

      if (lastPos == haystack.length && regexMatch[0].length < options.max_match_len) {
        tail = regexMatch[0]
      } else {
        var dataToAppend = getDataToAppend(before,regexMatch);
        rewritten += dataToAppend;
      }
    }

    if (tail.length < 1)
      tail = haystack.slice(lastPos) > options.max_match_len ? haystack.slice(lastPos).slice(0 - options.max_match_len) : haystack.slice(lastPos)

    var dataToQueue = getDataToQueue(matchCount,haystack,rewritten,lastPos);
    this.queue(dataToQueue);
  }

  function getDataToAppend(before, match) {
    var dataToAppend = before;

    totalMatches++;

    dataToAppend += isRegex ? replaceFn.apply(this, match.concat([match.index, match.input])) : replaceFn(match[0]);

    return dataToAppend;
  }

  function getDataToQueue(matchCount, haystack, rewritten, lastPos) {
    var dataToQueue;

    if (matchCount > 0) {
      if (haystack.length > tail.length) {
        dataToQueue = rewritten + haystack.slice(lastPos, haystack.length - tail.length)
      } else {
        dataToQueue = rewritten
      }
    } else {
      dataToQueue = haystack.slice(0, haystack.length - tail.length)
    }

    return dataToQueue;
  }

  function end() {
    if (tail) this.queue(tail);
    this.queue(null);
  }

  var t = through(write, end);
  return t;
}

function createReplaceFn(replace, isRegEx) {
  var regexReplaceFunction = function () {
    var newReplace = replace;
    // ability to us $1 with captures
    // Start at 1 and end at length - 2 to avoid the match parameter and offset
    // And string parameters
    var paramLength = arguments.length - 2;
    for (var i = 1; i < paramLength; i++) {
      newReplace = newReplace.replace('$' + i, arguments[i] || '')
    }
    return newReplace;
  };

  var stringReplaceFunction = function () {
    return replace;
  };

  if (isRegEx && !(replace instanceof Function)) {
    return regexReplaceFunction;
  }

  if (!(replace instanceof Function)) {
    return stringReplaceFunction
  }

  return replace
}

function escapeRegExp(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function matchFromRegex(s, options) {
  if (options.regExpOptions) {
    return new RegExp(s.source, options.regExpOptions)
  } else {
    var flags = s.toString().replace(/\/[^\/].*\//, '')
    // If there is no global flag then there can only be one match
    if (flags.indexOf('g') < 0) {
      options.limit = 1;
    }
    return new RegExp(s.source, flags)
  }
}

function matchFromString(s, options) {
  return new RegExp(escapeRegExp(s), options.regExpOptions);
}
