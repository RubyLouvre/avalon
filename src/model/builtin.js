

var rtopsub = /([^.]+)\.(.+)/

var batchUpdateEntity = require("../strategy/batchUpdateEntity")
var $emit = require("./dispatch").$emit



module.exports = {
    rtopsub: rtopsub,
    Observer: Observer,
    isSkip: isSkip,
   
}