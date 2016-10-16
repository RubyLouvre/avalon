var avalon = {}
avalon.define = function (obj) {
    return Observer(obj)
}
var rword = /[^, ]+/g
avalon.mix = function (a, b) {
    for (var i in b) {
        a[i] = b[i]
    }
}
var delayCompile = {}
avalon.noop = function () {
}
var rhashcode = /\d\.\d{4}/
avalon.makeHashCode = function (prefix) {
    /* istanbul ignore next*/
    prefix = prefix || 'avalon'
    /* istanbul ignore next*/
    return String(Math.random() + Math.random()).replace(rhashcode, prefix)
}
var hasConsole = typeof console === 'object'
avalon.config = function fn(obj) {
    for (var i in obj) {
        fn[i] = obj[i]
    }
}
avalon.config({
    debug: 1
})
avalon.log = function () {
    if (hasConsole && avalon.config.debug) {
        // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        Function.apply.call(console.log, console, arguments)
    }
}


avalon.quote = typeof JSON !== 'undefined' ? JSON.stringify : new function () {
    //https://github.com/bestiejs/json3/blob/master/lib/json3.js
    var Escapes = {
        92: "\\\\",
        34: '\\"',
        8: "\\b",
        12: "\\f",
        10: "\\n",
        13: "\\r",
        9: "\\t"
    }

    var leadingZeroes = '000000'
    var toPaddedString = function (width, value) {
        return (leadingZeroes + (value || 0)).slice(-width)
    };
    var unicodePrefix = '\\u00'
    var escapeChar = function (character) {
        var charCode = character.charCodeAt(0), escaped = Escapes[charCode]
        if (escaped) {
            return escaped
        }
        return unicodePrefix + toPaddedString(2, charCode.toString(16))
    };
    var reEscape = /[\x00-\x1f\x22\x5c]/g
    return function (value) {
        reEscape.lastIndex = 0
        return '"' + (reEscape.test(value) ? String(value).replace(reEscape, escapeChar) : value) + '"'
    }
}
function isArray(a) {
    return Array.isArray(a)
}
function isObservable(key, value) {
    return (typeof value !== 'function') && key.charAt(0) !== '$'
}
function isObject(a) {
    return a && typeof a === 'object'
}
function copy(target) {
    var ret;

    if (isArray(target)) {
        ret = target.slice(0);
    } else if (isObject(target)) {
        ret = avalon.mix({}, target);
    }

    return ret || target
}
function hasAttr(node, name) {
    return typeof node.getAttribute(node, 'ms-' + name) === 'string' ||
            typeof node.getAttribute(node, ':' + name) === 'string'
}

avalon.each = function (a, fn) {
    if (isArray(a)) {
        a.forEach(function (el, index) {
            fn(index, el)
        })
    } else {
        for (var i in a) {
            fn(i, a[i])
        }
    }
}
avalon.directives = {}
avalon.directive = function (name, opts) {
    avalon.directives[name] = opts
    if (opts.delay) {
        delayCompile[name] = 1
    }
}


avalon.oneObject = function (array, val) {
    if (typeof array === 'string') {
        array = array.match(rword) || []
    }
    var result = {},
            value = val !== void 0 ? val : 1
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value
    }
    return result
}
function createObserver(target, key) {
    if (isObject(target)) {
        return target.$events ? target : new Observer(target, key)
    }
}
function Observer(data, key, vm) {
    if (isArray(data)) {
        vm = observeArray(data, key);
    } else {
        vm = observeObject(data);
    }
    vm.$events.__dep__ = new Depend()
    return vm
}

function observeObject(object) {
    var core = {} //events
    var state = {}
    var props = {}
    for (var key in object) {
        var val = object[key]
        if (isObservable(key, val)) {
            state[key] = createAccessor(key, val, core)
        } else {
            props[key] = val
        }
    }

    addMoreProps(props, object, state, core)
    var observe = {}
    observe = createViewModel(observe, state, props)
    for (var i in props) {
        observe[i] = props[i]
    }
    core.observe = observe
    return observe
}

function observeObject2(before, after) {
    var core = before.$events
    var state = before.$accessor
    var object = after.data
    delete after.data
    var props = after
    console.log('observeObject2')
    for (var key in object) {
        state[key] = createAccessor(key, object[key], core)
    }

    addMoreProps(props, object, state, core)
    var observe = {}
    observe = createViewModel(observe, state, props)
    for (var i in props) {
        observe[i] = props[i]
    }
    core.observe = observe
    return observe
}


function createViewModel(a, b, c) {
    return Object.defineProperties(a, b)
}
function observeArray(array, key, skip) {
    if (!skip)
        rewriteArrayMethods(array)
    array.forEach(function (item) {
        createObserver(item, key, skip)
    })
    return array
}

function createAccessor(key, val, core) {
    var value = val
    var childOb = createObserver(val, key)
    return {
        get: function Getter() {
            var ret = value
            if (Depend.watcher) {
                core.__dep__.collect()
                if (childOb && childOb.$events) {
                    childOb.$events.__dep__.collect()
                }
            }
            if (isArray(ret)) {
                ret.forEach(function (el) {
                    if (el && el.$events) {
                        el.$events.__dep__.collect()
                    }
                })
            }
            return ret
        },
        set: function Setter(newValue) {
            var oldValue = value
            if (newValue === oldValue) {
                return
            }
            core.__dep__.beforeNotify()
            value = newValue
            childOb = createObserver(newValue, key)
            core.__dep__.notify()
        },
        enumerable: true,
        configurable: true
    }
}



function addMoreProps(props, object, state, core) {
    var hash = avalon.makeHashCode("$")
    avalon.mix(props, {
        $id: object.$id || hash,
        $events: core,
        $hashcode: hash,
        $accessor: state
    })

}
//------------------
var ap = Array.prototype
var __array__ = {}
var __method__ = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
function rewriteArrayMethods(array) {
    /* istanbul ignore else */
    for (var i in __array__) {
        array[i] = __array__[i]
    }
    array.$events = {} // 以后自动加上    
}

__method__.forEach(function (method) {
    var original = ap[method]
    __array__[method] = function () {
        // 继续尝试劫持数组元素的属性

        var args = [],
                size = this.length,
                core = this.$events
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }
        core.__dep__.beforeNotify()
        var result = original.apply(this, args)
        var inserts = []
        switch (method) {
            case 'push':
            case 'unshift':
                inserts = args;
                break;
            case 'splice':
                inserts = args.slice(2);
                break;
        }
        if (inserts && inserts) {
            observeArray(inserts, 0, 1)
        }
        //  warlords.toModel(this)
        //  notifySize(this, size)
        core.__dep__.notify({
            method: method,
            args: args
        })
        return result
    }
})

//------------------

var guid = 0;
/**
 * 依赖收集模块
 * @param  {String}  key  [依赖数据字段]
 */
function Depend(key) {
    this.key = key;
    this.watchers = [];
    this.guid = guid++;
}

/**
 * 当前收集依赖的订阅模块 watcher
 * @type  {Object}
 */
Depend.watcher = null;
var dp = Depend.prototype;
/**
 * 添加依赖订阅
 * @param  {Object}  watcher
 */
dp.addWatcher = function (watcher) {
    this.watchers.push(watcher)
}

/**
 * 移除依赖订阅
 * @param  {Object}  watcher
 */
dp.removeWatcher = function (watcher) {
    var index = this.watchers.indexOf(watcher);
    if (index > -1) {
        this.watchers.splice(index, 1);
    }
}

/**
 * 为 watcher 收集当前的依赖
 */
dp.collect = function () {
    if (Depend.watcher) {
        Depend.watcher.addDepend(this)
    }
}

/**
 * 依赖变更前调用方法，用于旧数据的缓存处理
 */
dp.beforeNotify = function () {
    this.watchers.forEach(function (watcher) {
        watcher.beforeUpdate();
    });
}

/**
 * 依赖变更，通知每一个订阅了该依赖的 watcher
 * @param  {Object}  args  [数组操作参数信息]
 */
dp.notify = function (args) {
    var guid = this.guid;
    this.watchers.forEach(function (watcher) {
        watcher.update(args, guid);
    });
}

//============Watcher模块============

/**
 * 遍历对象/数组每一个可枚举属性
 * @param  {Object|Array}  target  [遍历值/对象或数组]
 * @param  {Boolean}       root    [是否是根对象/数组]
 */
var walkedObs = [];
function walkThrough(target, root) {
    var events = target && target.$events


    var guid = events && events.__dep__.guid

    if (guid) {
        if (walkedObs.indexOf(guid) > -1) {
            return;
        } else {
            walkedObs.push(guid);
        }
    }

    avalon.each(target, function (key, value) {
        walkThrough(value, false)
    });
    if (root) {
        walkedObs.length = 0;
    }
}
//每一个$watch

function Watcher(vm, desc, callback, context) {
    this.vm = vm;
    avalon.mix(this, desc);
    this.callback = callback;
    this.context = context || this;
    // 依赖 id 缓存
    this.depIds = [];
    this.newDepIds = [];
    this.shallowIds = [];
    // 依赖实例缓存
    this.depends = [];
    this.newDepends = [];
    var expr = desc.expr;
    var preSetFunc = typeof expr === 'function'
    // 缓存取值函数
    this.getter = preSetFunc ? expr : createGetter(expr);
    // 缓存设值函数（双向数据绑定）
    this.setter = this.type === 'duplex' ? createSetter(expr) : null;
    // 缓存表达式旧值
    this.oldVal = null;
    // 表达式初始值 & 提取依赖
    this.value = this.get();
}



var wp = Watcher.prototype;
/**
 * 获取取值域
 * @return  {Object}
 */
wp.getScope = function () {
    return this.context.scope || this.vm
}

wp.getValue = function () {
    var scope = this.getScope();
    try {
        return this.getter.call(scope, scope)
    } catch (e) {
        avalon.log(this.getter + 'exec error')
    }
}

wp.setValue = function (value) {
    var scope = this.getScope();
    if (this.setter) {
        this.setter.call(scope, scope, value);
    }
}
wp.get = function () {
    var value;
    this.beforeGet()
    value = this.getValue()
    // 深层依赖获取
    if (this.deep) {
        // 先缓存浅依赖的 ids
        this.shallowIds = copy(this.newDepIds);
        walkThrough(value, true);
    }

    this.afterGet();
    return value;
}

wp.beforeGet = function () {
    Depend.watcher = this;
}

wp.addDepend = function (depend) {
    var guid = depend.guid;
    var newIds = this.newDepIds;
    if (newIds.indexOf(guid) < 0) {
        newIds.push(guid);
        this.newDepends.push(depend);
        if (this.depIds.indexOf(guid) < 0) {
            depend.addWatcher(this);
        }
    }
}

wp.removeDepends = function (filter) {
    var self = this
    this.depends.forEach(function (depend) {
        if (filter) {
            if (filter.call(self, depend)) {
                depend.removeWatcher(self);
            }
        } else {
            depend.removeWatcher(self);
        }
    });
}

wp.afterGet = function () {
    Depend.watcher = null;
    // 清除无用的依赖
    this.removeDepends(function (depend) {
        return this.newDepIds.indexOf(depend.guid) < 0;
    });
    // 重设依赖缓存
    this.depIds = copy(this.newDepIds);
    this.newDepIds.length = 0;
    this.depends = copy(this.newDepends);
    this.newDepends.length = 0;
}

wp.beforeUpdate = function () {
    this.oldVal = copy(this.value);
}

wp.update = function (args, guid) {
    var oldVal = this.oldVal;
    var newVal = this.value = this.get();
    var callback = this.callback;
    if (callback && (oldVal !== newVal)) {

        if (this.type == 'nodeValue')
            console.log(this.node, this.node && this.node.parentNode)
        var fromDeep = this.deep && this.shallowIds.indexOf(guid) < 0;
        callback.call(this.context, newVal, oldVal, fromDeep, args);
    }
}

wp.destroy = function () {
    this.value = null
    this.removeDepends()
    if (this._destroy) {
        this._destroy()
    }
    for (var i in this) {
        delete this[i]
    }
}
avalon.scan = function (vm, el) {
    return new Render(vm, el)
}
//--------------

function isDirective(directive) {
    return /^(?:\:|ms-)\w+/.test(directive)
}

function delayCompileNodes(dirs) {
    for (var i in delayCompile) {
        if (('ms-' + i) in dirs) {
            return true
        }
    }
}
var regMustache = /\{\{.+\}\}/
function getRawBindings(node) {
    if (node.nodeType === 1) {
        var attrs = node.attributes;
        var props = {}, has = false
        for (var i = 0, n = attrs.length; i < n; i++) {
            var attr = attrs[i]
            if (attr.specified) {
                var name = attr.name
                if (name.charAt(0) === ':') {
                    name = name.replace(rcolon, 'ms-')
                }
                if (name.indexOf('ms-') === 0) {
                    props[name] = attr.value
                    has = true
                }

            }
        }

        return has ? props : false
    } else if (node.nodeType === 3) {
        if (regMustache.test(node.nodeValue)) {
            return {
                nodeValue: node.nodeValue
            }
        }
    }
}
function nodeToFragment(a) {
    var f = createFragment()
    while (a.firstChild) {
        f.appendChild(a.firstChild)
    }
    return f
}
function Render(vm, el) {
    this.$element = el
    this.vm = vm
    this.$queue = []
    this.$afters = []
    this.$directives = []
    this.init()
}

var cp = Render.prototype
cp.init = function () {
    this.$done = false;
    this.$fragment = nodeToFragment(this.$element);
    this.compile(this.$fragment, true);
}


cp.compile = function (element, root) {
    var childNodes = element.childNodes
    var scope = this.vm
    var dirs = getRawBindings(element)
    if (dirs) {
        this.$queue.push([element, scope, dirs]);
    }
    var childNodes = element.childNodes
    if (!/style|textarea|xmp|script|template/i.test(element.nodeName)
            && childNodes
            && childNodes.length
            && !delayCompileNodes(dirs || {})
            ) {
        for (var i = 0; i < childNodes.length; i++) {
            this.compile(childNodes[i], false)
        }
    }
    if (root) {
        this.compileAll();
    }
}

cp.compileAll = function () {
    this.$queue.forEach(function (tuple) {
        this.complieNode(tuple)
    }, this);
    this.completed()
}

cp.completed = function () {

    this.$done = true;
    this.$element.appendChild(this.$fragment);

    // 触发编译完成后的回调函数
    this.$afters.forEach(function (after) {
        after[0].call(after[1]);
        return null;
    });

}
cp.destroy = function () {

    this.$directives.forEach(function (directive) {
        directive.destroy();
    });
    for (var i in this) {
        delete this[i]
    }

}
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

/**
 * 收集并编译节点指令
 * @param   {Array}  tuple  [node, scope]
 */
cp.complieNode = function (tuple) {
    var node = tuple[0]
    var scope = tuple[1]
    var dirs = tuple[2]
    if ('nodeValue' in dirs) {
        this.parseText(node, dirs, scope);
    } else if (!('ms-skip' in dirs)) {
        var uniq = {}, bindings = []
        var directives = avalon.directives
        for (var name in dirs) {
            var value = dirs[name]
            var rbinding = /^(\:|ms\-)\w+/
            var match = name.match(rbinding)
            var arr = name.replace(match[1], '').split('-')

            if (eventMap[arr[0]]) {
                arr.unshift('on')
            }
            if (arr[0] === 'on') {
                arr[2] = parseFloat(arr[2]) || 0
            }
            arr.unshift('ms')
            var type = arr[1]
            if (directives[type]) {

                var binding = {
                    type: type,
                    param: arr[2],
                    name: arr.join('-'),
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }
                if (type === 'on') {
                    binding.priority += arr[3]
                }
                if (!uniq[binding.name]) {
                    uniq[binding.name] = value
                    bindings.push(binding)
                    if (type === 'for') {
                        bindings = [binding]
                        break
                    }
                }

            }

        }

        bindings.forEach(function (binding) {
            this.parse(node, binding, scope);
        }, this)
    }
}
cp.parse = function (node, binding, scope) {
    var dir = avalon.directives[binding.type]
    if (dir) {
        if (dir.parse) {
            dir.parse(binding)
        }
        this.$directives.push(new DirectiveWatcher(node, binding, scope))
    }
}

cp.parseText = function (node, dir, scope) {
    var rlineSp = /\n\r?/g

    var text = dir.nodeValue.trim().replace(rlineSp, '')

    var pieces = text.split(/\{\{(.+?)\}\}/g)
    var tokens = []
    pieces.forEach(function (piece) {
        var segment = "{{" + piece + "}}"
        if (text.indexOf(segment) > -1) {
            tokens.push('(' + piece + ')')
            text = text.replace(segment, '')
        } else if (piece) {
            tokens.push(avalon.quote(piece))
            text = text.replace(piece, '')
        }
    })
    var binding = {
        expr: tokens.join('+'),
        name: 'nodeValue',
        type: 'nodeValue'
    }

    this.$directives.push(new DirectiveWatcher(node, binding, scope))
}


//===============
var stringNum = 0
var stringPool = {
    map: {}
}
var rfill = /\?\?\d+/g
function dig(a) {
    var key = '??' + stringNum++
    stringPool.map[key] = a
    return key + ' '
}
function fill(a) {
    var val = stringPool.map[a]
    return val
}
function clearString(str) {
    var array = readString(str)
    for (var i = 0, n = array.length; i < n; i++) {
        str = str.replace(array[i], dig)
    }
    return str
}

function readString(str) {
    var end, s = 0
    var ret = []
    for (var i = 0, n = str.length; i < n; i++) {
        var c = str.charAt(i)
        if (!end) {
            if (c === "'") {
                end = "'"
                s = i
            } else if (c === '"') {
                end = '"'
                s = i
            }
        } else {
            if (c === '\\') {
                i += 1
                continue
            }
            if (c === end) {
                ret.push(str.slice(s, i + 1))
                end = false
            }
        }
    }
    return ret
}

var rguide = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var ruselessSp = /\s*(\.|\|)\s*/g
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
function addScope(expr) {
    var body = expr.trim().replace(rregexp, dig)//移除所有正则
    body = clearString(body)      //移除所有字符串
    return body.replace(ruselessSp, '$1').//移除.|两端空白
            replace(rguide, '$1__vmodel__.').//转换@与##
            replace(rfill, fill).replace(rfill, fill)
}
function createGetter(expr) {
    var body = addScope(expr)

    try {
        return new Function('__vmodel__', 'return ' + body + ';');
    } catch (e) {
        avalon.log('parse getter: ', expr, ' error');
        return avalon.noop
    }
}

/**
 * 生成表达式设值函数
 * @param  {String}  expr
 */
function createSetter(expr) {
    var body = addScope(expr)
    if (body.indexOf('__vmodel__') !== 0) {
        body = ' __vmodel__.' + body
    }
    body = 'try{ ' + body + ' = __value__}catch(e){}'
    try {
        return new Function('__vmodel__', '__value__', body + ';');
    } catch (e) {
        avalon.log('parse setter: ', expr, ' error');
        return avalon.noop
    }
}

//指令是一个warcher
function DirectiveWatcher(node, binding, scope) {
    var type = binding.type
    var directive = avalon.directives[type]
    if (node.nodeType === 1) {
        node.removeAttribute('ms-' + type)
        node.removeAttribute(':' + type)
    }
    var callback = directive.update ? function (value) {

        directive.update.call(this, node, value)
    } : avalon.noop
    var watcher = new Watcher(scope, binding, callback)
    // get (beforeGet, getter, afterGet)

    watcher.node = node
    watcher._destory = directive.destory
    if (directive.init)
        directive.init(watcher)
    delete watcher.value
    watcher.update()
    return watcher
}

avalon.directive('nodeValue', {
    update: function (node, value) {
        node.nodeValue = value
    }
})
avalon.directive('attr', {
    update: function (node, value) {
        for (var i in value) {
            node[i] = value[i]
        }
    }
})
avalon.directive('on', {
   

    init: function (watcher) {
        var node = watcher.node
        var body = addScope(watcher.expr)
        var rhandleName = /^__vmodel__\.[$\w\.]+$/i
        if (rhandleName.test(body)) {
            body = body + '($event)'
        }

        body = body.replace(/__vmodel__\.([^(]+)\(([^)]*)\)/, function (a, b, c) {
            return '__vmodel__.' + b + ".call(__vmodel__" + (/\S/.test(c) ? ',' + c : "") + ")"
        })
        var ret = [
            'try{',
            '\tvar __vmodel__ = this;',
            '\t' + body,
            '}catch(e){avalon.log(e)}']
        var fn = new Function('$event', ret.join('\n'))
        this.eventHandler = function (e) {
            return fn.call(watcher.vm, e)
        }
        node.addEventListener(watcher.param, this.eventHandler)
    },
    destory: function () {
        this.node.removeEventListener(this.param, this.eventHandler)
    }
})
avalon.directive('if', {
    delay: true,
    init: function (watcher) {
        var node = watcher.node
        node.removeAttribute('ms-if')
        node.removeAttribute(':if')
        watcher.node = node
        var parent = node.parentNode
        var c = watcher.placeholder = createAnchor('if')
        parent.replaceChild(c, node)
        watcher.isShow = true
        var f = createFragment()
        f.appendChild(node)
        watcher.fragment = f.cloneNode(true)
        watcher.boss = avalon.scan(watcher.vm, f)
        if (!!watcher.value) {
            parent.replaceChild(f, c)
        }
    },
    update: function (node, value) {
        value = !!value
        if (this.isShow === value)
            return
        this.isShow = value
        if (value) {

            var c = this.placeholder
            var p = c.parentNode
            var node = this.fragment.cloneNode(true)
            this.boss = avalon.scan(this.vm, node)
            this.node = node.firstChild
            p.replaceChild(node, c)

        } else {

            var p = this.node.parentNode
            var c = this.placeholder
            p.replaceChild(c, this.node)
            this.boss.destroy()
        }


    }
})
avalon.directive('html', {
    update: function (node, value) {
        this.boss && this.boss.destroy()
        var div = document.createElement('div')
        div.innerHTML = value
        this.boss = avalon.scan(this.vm, div)
        nodeToFragment(node)
        node.appendChild(nodeToFragment(div))
    },
    delay: true
})
avalon.directive('duplex', {
    init: function (watcher) {
        var node = watcher.node
        this.eventHandler = function () {
            watcher.setValue(node.value)
        }
        if (/password|text|hidden/i.test(node.type)) {
            node.addEventListener('input', this.eventHandler)
        }
    },
    update: function (node, value) {
        if (/password|text|hidden/i.test(node.type)) {
            node.value = value
        }
    },
    destory: function () {
        this.node.removeEventListener('input', this.eventHandler)
    }
})
avalon.directive('text', {
    delay: true,
    init: function (watcher) {
        var node = watcher.node
        nodeToFragment(node)
        var child = document.createTextNode(watcher.value)
        node.appendChild(child)
        watcher.node = child
        var type = 'nodeValue'
        watcher.type = watcher.name = type
        var directive = avalon.directives[type]
        watcher.callback = function (value) {
            directive.update.call(this, watcher.node, value)
        }
    }
})

avalon.directive('text', {
    delay: true,
    init: function (watcher) {
        var node = watcher.node
        nodeToFragment(node)
        var child = document.createTextNode(watcher.value)
        node.appendChild(child)
        watcher.node = child
        var type = 'nodeValue'
        watcher.type = watcher.name = type
        var directive = avalon.directives[type]
        watcher.callback = function (value) {
            directive.update.call(this, watcher.node, value)
        }
    }
})

var none = 'none'
function getDisplay(el) {
    return window.getComputedStyle(el, null).display
}
function parseDisplay(elem, val) {
    //用于取得此类标签的默认display值
    var doc = elem.ownerDocument
    var nodeName = elem.nodeName
    var key = '_' + nodeName
    if (!parseDisplay[key]) {
        var temp = doc.body.appendChild(doc.createElement(nodeName))
        val = getDisplay(temp)
        doc.body.removeChild(temp)
        if (val === none) {
            val = 'block'
        }
        parseDisplay[key] = val
    }
    return parseDisplay[key]
}
avalon.directive('skip', {
    delay: true
})
avalon.directive('visible', {
    init: function (watcher) {
        watcher.isShow = true
    },
    update: function (node, value) {
        var isShow = !!value
        if (this.isShow === isShow)
            return
        this.isShow = isShow
        var display = node.style.display
        if (isShow) {
            if (display === none) {
                value = this.displayValue
                if (!value) {
                    node.style.display = ''
                    if (node.style.cssText === '') {
                        node.removeAttribute('style')
                    }
                }
            }
            if (node.style.display === '' && getDisplay(node) === none &&
                    // fix firefox BUG,必须挂到页面上
                    node.ownerDocument.contains(node)) {

                value = parseDisplay(node)
            }

        } else {
            if (display !== none) {
                value = none
                this.displayValue = display
            }
        }
        function cb() {
            if (value !== void 0) {
                node.style.display = value
            }
        }
        cb()
    }
})
var rforAs = /\s+as\s+([$\w]+)/
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rinvalid = /^(null|undefined|NaN|window|this|\$index|\$id)$/
var rargs = /[$\w_]+/g
avalon.directive('for', {
    delay: true,
    parse: function(binding){
        var str = binding.origExpr = binding.expr, asName
        str = str.replace(rforAs, function (a, b) {
            /* istanbul ignore if */
            if (!rident.test(b) || rinvalid.test(b)) {
                avalon.error('alias ' + b + ' is invalid --- must be a valid JS identifier which is not a reserved name.')
            } else {
                asName = b
            }
            return ''
        })

        var arr = str.split(' in ')
        var kv = arr[0].match(rargs)
        if (kv.length === 1) {//确保avalon._each的回调有三个参数
            kv.unshift('$key')
        }
        binding.expr = arr[1]
        binding.indexName = kv[0]
        binding.valName = kv[1]
        binding.signature = avalon.makeHashCode('for')
        if (asName) {
            binding.asName = asName
        }
      

    },
    init: function (watcher) {
       
        var begin = createAnchor('ms-for:' + watcher.origExpr)
        var end = createAnchor('ms-for-end:')
        var node = watcher.node
        var p = node.parentNode
        p.insertBefore(begin, node)
        p.replaceChild(end, node)
        var f = createFragment()
        watcher.fragment = f.appendChild(node)
        f.appendChild(createAnchor(watcher.signature))
        watcher.node = begin
      /**
       * 
       *  if (directive.init)
        directive.init(watcher)
    delete watcher.value
    watcher.update()
       * 
       */
     
        watcher.update = function () {
            var newVal = this.value = this.get()
            var traceIds = createTraceIDs(this, newVal)
            var callback = this.callback;
            if (this.oldTrackIds !== traceIds) {
                this.oldTrackIds = traceIds
                callback.call(this.context, newVal, traceIds);
            }
        }
        
    },
    update: function (node, value) {
        var preItems = this.preItems
        var items = this.items
        if (!preItems) {
            buildItems(this)
        }

    }

})


function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}
function createFragment() {
    return document.createDocumentFragment()
}
function createTraceIDs(watcher, obj) {
    if (isObject(obj)) {
        var array = isArray(obj)
        var ids = []
        var items = []
        avalon.each(obj, function (key, value) {
            if (array) {
                var k = getTraceKey(value)
                items.push({
                    key: k,
                    s: value
                })
                ids.push(k)
            } else {
                items.push({
                    key: k,
                    s: value
                })
                ids.push(key)
            }
        })
        if (watcher.items) {
            watcher.preItems = watcher.items
            watcher.items = items
        } else {
            watcher.items = items
        }
        return ids.join(';;')
    } else {
        return NaN
    }
}

function createAnchor(nodeValue) {
    return document.createComment(nodeValue)
}

function buildItems(watcher) {
    console.log("333333")
    watcher.items.forEach(function (item, index) {
        item.dom = watcher.fragment.cloneNode()
        var data = {}
        data[watcher.keyName] = index
        data[watcher.valName] = item
        if (watcher.asName) {
            data[watcher.asName] = []
        }
//        item.vm = observeObject2(watcher.vm, {
//            data: data
//        })
        console.log(watcher.vm)
    })

}