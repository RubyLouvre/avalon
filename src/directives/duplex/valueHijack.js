var valueHijack = false
try { //#272 IE9-IE11, firefox
    var setters = {}
    var aproto = HTMLInputElement.prototype
    var bproto = HTMLTextAreaElement.prototype
    function newSetter(value) { // jshint ignore:line
        setters[this.tagName].call(this, value)
        if (!this.caret && this._ms_field_) {
            this._ms_field_.update.call(this)
        }
    }
    var inputProto = HTMLInputElement.prototype
    Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
    setters['INPUT'] = Object.getOwnPropertyDescriptor(aproto, 'value').set

    Object.defineProperty(aproto, 'value', {
        set: newSetter
    })
    setters['TEXTAREA'] = Object.getOwnPropertyDescriptor(bproto, 'value').set
    Object.defineProperty(bproto, 'value', {
        set: newSetter
    })
    valueHijack = true
} catch (e) {
    //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
    // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
    // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
}
module.exports = valueHijack