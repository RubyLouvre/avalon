var avalon = require('../../dist/avalon')
var vm = avalon.define({
    $id:"first",
    tabs: [111,222,333],
    activeIndex: 0,
    panels: ["面板1","面板2",'<p>这里可以是复杂的<b>HTML</b></p>']
   
})

module.exports = vm