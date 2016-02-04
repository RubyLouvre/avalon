// https://github.com/rsms/js-lru
function LRU(maxLength) {
    this.size = 0
    this.limit = maxLength
    this.head = this.tail = void 0
    this._keymap = {}
}

var p = LRU.prototype

p.put = function (key, value) {
    var entry = {
        key: key,
        value: value
    }
    this._keymap[key] = entry
    if (this.tail) {
        this.tail.newer = entry
        entry.older = this.tail
    } else {
        this.head = entry
    }
    this.tail = entry
    if (this.size === this.limit) {
        this.shift()
    } else {
        this.size++
    }
    return value
}

p.shift = function () {
    var entry = this.head
    if (entry) {
        this.head = this.head.newer
        this.head.older =
                entry.newer =
                entry.older =
                this._keymap[entry.key] = void 0
        delete this._keymap[entry.key] //#1029
    }
}
p.get = function (key) {
    var entry = this._keymap[key]
    if (entry === void 0)
        return
    if (entry === this.tail) {
        return  entry.value
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
        if (entry === this.head) {
            this.head = entry.newer
        }
        entry.newer.older = entry.older // C <-- E.
    }
    if (entry.older) {
        entry.older.newer = entry.newer // C. --> E
    }
    entry.newer = void 0 // D --x
    entry.older = this.tail // D. --> E
    if (this.tail) {
        this.tail.newer = entry // E. <-- D
    }
    this.tail = entry
    return entry.value
}

module.exports = LRU
