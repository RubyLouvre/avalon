Render(vm, root, body) {
    var fork = Function('__vmodel__', '$$l',
        'var \u01A9 = __vmodel__.$render;' +
        'return ' + body)
    this.fork = fork
    this.template = fork + ''
    vm.$render = this
}
Render.prototype = {

    static: function(i) {
        return avalon.staticNodes[i]
    },
    comment: function(value) {
        return { nodeName: '#comment', nodeValue: value }
    },
    text: function(a, d) {
        var b = avalon.text(a) || '\u200b'
        return { nodeName: '#text', nodeValue: b, dynamic: !!d }
    },
    collectSlot: function(node, slots) {
        var name = node.props.slot
        if (!slots[name]) {
            slots[name] = []
        }
        slots[name].push(node)
        return node
    },

    slot: function(name) {
        var a = this.slots[name]
        a.slot = name
        return a
    },
    ctrl: function(id, scope, isImport, cb) {
        // this为render
        var name = isImport ? 'important' : 'controller'
        var dir = directives[name]
        var scope2 = dir.getScope.call(this, id, scope)
        var isSkip = isImport && scope && scope !== scope2

        return cb(scope2, isSkip)
    },
    repeat: function(obj, str, cb) {
        var nodes = []
        var keys = str.split(',')
        nodes.cb = keys.splice(3, 7).join(',')
        __repeat(obj, Array.isArray(obj), function(i, flag) {
            repeatCb(obj, obj[i], i, keys, nodes, cb, flag)
        })
        return nodes
    },
    schedule() {
        if (!this._isScheduled) {
            this._isScheduled = true
            if (!avalon.uniqActions[this.uuid]) {
                avalon.uniqActions[this.uuid] = 1
                avalon.pendingActions.push(this)
            }
            runActions() //这里会还原_isScheduled
        }

    },
    update: function() {
        this.vm.$render = this
        var nodes = this.fork(this.vm, {})
        var root = this.root = nodes[0]
        if (this.noDiff) {
            return
        }
        try {
            diff(this.vnodes[0], root)
            this.vm.$element = this.vnodes[0]
        } catch (diffError) {
            avalon.log(diffError)
        }
        this._isScheduled = false
    },


    dispose: function() {

    },
    update: function() {
        this.vm.$render = this
        var nodes = this.fork(this.vm, {})
        var root = this.root = nodes[0]
        if (this.noDiff) {
            return
        }
        try {
            diff(this.vnodes[0], root)
            this.vm.$element = this.vnodes[0]
        } catch (diffError) {
            avalon.log(diffError)
        }
        this._isScheduled = false
    },


    /**
     * 将循环区域转换为for指令
     * @param {type} begin 注释节点
     * @param {type} scope
     * @param {type} parentChildren
     * @param {type} userCb 循环结束回调
     * @returns {undefined}
     */
    getForBinding(begin, scope, parentChildren, cb) {
        var expr = begin.nodeValue.replace('ms-for:', '').trim()
        begin.nodeValue = 'ms-for:' + expr

        var nodes = getRange(parentChildren, begin)
        this.scanChildren(nodes, scope, false)
        var end = nodes.end
        begin.dynamic = true
        parentChildren.splice(nodes.start, nodes.length, [])

        begin.for = {
            begin,
            end,
            expr,
            nodes,
            cb

        }

    },
    /**
     * 在带ms-for元素节点旁添加两个注释节点,组成循环区域
     * @param {type} vdom
     * @param {type} scope
     * @param {type} parentChildren
     * @param {type} expr
     * @returns {undefined}
     */
    getForBindingByElement(vdom, scope, parentChildren, expr) {
        var index = parentChildren.indexOf(vdom) //原来带ms-for的元素节点
        var props = vdom.props
        var begin = {
            nodeName: '#comment',
            nodeValue: 'ms-for:' + expr
        }
        if (props.slot) {
            begin.slot = props.slot
            delete props.slot
        }
        var end = {
            nodeName: '#comment',
            nodeValue: 'ms-for-end:'
        }
        parentChildren.splice(index, 1, begin, vdom, end)
        var cbName = 'data-for-rendered'
        var cb = props[cbName]
        delete props[cbName]
        this.getForBinding(begin, scope, parentChildren, cb || '')

    }

}

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

function repeatCb(obj, el, index, keys, nodes, cb, isArray) {
    let local = {}
    local[keys[0]] = el
    if (keys[1])
        local[keys[1]] = index
    if (keys[2])
        local[keys[1]] = obj
    var arr = cb(local)
    var key = isArray ? getTraceKey(el) : index
    if (arr.length === 1) {
        var elem = arr[0]
        elem.key = key
        nodes.push(elem)
    } else {
        elem = {
            key: key,
            nodeName: '#document-fragment',
            children: arr
        }
        nodes.push(elem)
    }

}