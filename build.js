//var a = require('./buildIE6')
//var b = require('./buildIE6Test')
var c = require('./buildIE9')
var d = require('./buildIE9Test')
Promise.all([c, d]).then(function() {
    console.log('build complete!!!')
}).catch(function() {
    console.log('build error!!!')
})