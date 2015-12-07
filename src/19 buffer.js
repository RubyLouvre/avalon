//使用来自游戏界的双缓冲技术,减少对视图的冗余刷新
var Buffer = function () {
    this.queue = []
}
Buffer.prototype = {
    render: function (isAnimate) {
        if (!this.locked) {
            this.locked = isAnimate ? root.offsetHeight + 10 : 1
            var me = this
            avalon.nextTick(function () {
                me.flush()
            })
        }
    },
    flush: function () {
        for (var i = 0, sub; sub = this.queue[i++]; ) {
            sub.update && sub.update()
        }
        this.locked = 0
        this.queue = []
    }
}

var buffer = new Buffer()
