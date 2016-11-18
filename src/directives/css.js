
import { avalon, platform } from '../seed/core'

var cssDir = avalon.directive('css', {
    diff: function (newVal, oldVal) {
        if (Object(newVal) === newVal) {
            newVal = platform.toJson(newVal)//安全的遍历VBscript
            if (Array.isArray(newVal)) {//转换成对象
                var b = {}
                newVal.forEach(function (el) {
                    el && avalon.shadowCopy(b, el)
                })
                newVal = b
                avalon.warn(this.type, '指令的值不建议使用数组形式了！')
            }

            var hasChange = false
            var patch = {}
            if (!oldVal) {//如果一开始为空
                patch = newVal
                hasChange = true
            } else {
                if (this.deep) {
                    var deep = typeof this.deep == 'number' ? this.deep : 6
                    for (var i in newVal) {//diff差异点  
                        if (!deepEquals(newVal[i], oldVal[i], 4)) {
                            this.value = newVal
                            return true
                        }
                        patch[i] = newVal[i]
                    }
                } else {
                    for (var i in newVal) {//diff差异点
                        if (newVal[i] !== oldVal[i]) {
                            hasChange = true
                        }
                        patch[i] = newVal[i]
                    }
                }

                for (var i in oldVal) {
                    if (!(i in patch)) {
                        hasChange = true
                        patch[i] = ''
                    }
                }
            }
            if (hasChange) {
                this.value = patch
                return true
            }
        }
        return false
    },
    update: function (vdom, value) {

        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            var wrap = avalon(dom)
            for (var name in value) {
                wrap.css(name, value[name])
            }
        }
    }
})

export var cssDiff = cssDir.diff

export function getEnumerableKeys(obj) {
    const res = [];
    for (let key in obj)
        res.push(key)
    return res
}

export function deepEquals(a, b, level) {
    if (level === 0)
        return a === b
    if (a === null && b === null)
        return true
    if (a === undefined && b === undefined)
        return true
    const aIsArray = Array.isArray(a)
    if (aIsArray !== Array.isArray(b)) {
        return false
    } else if (aIsArray) {
        if (a.length !== b.length) {
            return false
        }
        for (let i = a.length - 1; i >= 0; i--) {
            try {
                if (!deepEquals(a[i], b[i], level - 1)) {
                    return false
                }
            } catch (noThisPropError) {
                return false
            }
        }
        return true
    } else if (typeof a === "object" && typeof b === "object") {
        if (a === null || b === null)
            return false;
        if (getEnumerableKeys(a).length !== getEnumerableKeys(b).length)
            return false;
        for (let prop in a) {
            if (!(prop in b))
                return false
            try {
                if (!deepEquals(a[prop], b[prop], level - 1)) {
                    return false
                }
            } catch (noThisPropError) {
                return false
            }
        }
        return true
    }
    return a === b
}