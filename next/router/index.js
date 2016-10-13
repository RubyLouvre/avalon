export default function Router(options) {
    var opts = this.options = options || {}
    this.app = opts.app
    this.beforeHooks = []
    this.afterHooks = []
    this.match = createMatcher(opts.routers || [])
    var mode = opts.mode || 'hash'
    var fallback = this.fallback = mode === 'history' && !supportsHistory
    if (fallback)
        mode = 'hash'
    if (!inBrowser)
        mode = 'abstract'
    switch (mode) {
        case 'history':
            this.history = new HTML5History(this, opts.base)
            break
        case 'hash':
            this.history = new HashHistory(this, opts.base, fallback)
            break
        case 'abstract':
            this.history = new AbstractHistory(this)
            break

    }
    this.history.listen(function (route) {
        this.app._route = route
    })
}

Router.prototype = {
    currentRoute: function () {
        return this.history && this.history.current
    },
    beforeEach: function (fn) {
        this.beforeHooks.push(fn)
    },
    afterEach: function (fn) {
        this.afterHooks.push(fn)
    },
    push: function (location) {
        this.history.push(location)
    },
    replace: function (location) {
        this.history.replace(location)
    },
    go: function (n) {
        this.history.go(n)
    },
    back: function () {
        this.go(-1)
    },
    forward: function () {
        this.go(1)
    },
    getMatchedComponents: function () {
        if (!this.currentRoute()) {
            return []
        }
        return [].concat.apply([], this.currentRoute.matched.map(function (m) {
            return Object.keys(m.components).map(function (key) {
                return m.components[key]
            })
        }))
    }
}