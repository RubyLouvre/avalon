define(["avalon.position"], function(avalon) {
    var defaults = {
        position: {
            my: "left top+15",
            at: "left bottom"
        }
    }
//所有绑定都依赖于某个绑定的某个属性，从而决定它的生命周期

    var styleEl = document.getElementById("avalonStyle")
    var text = ".ui-tooltip-arrow{position:absolute; height:0px; width:0px; font-size:0px; line-height:0px; border-width: 1px solid red;}"
    try {
        styleEl.innerHTML += text
    } catch (e) {
        styleEl.styleSheet.cssText += text
    }

    function filterData(obj, prefix) {
        var result = {}
        for (var i in obj) {
            if (i.indexOf(prefix) === 0) {
                result[  i.replace(prefix, "").replace(/\w/, function(a) {
                    return a.toLowerCase()
                }) ] = obj[i]
            }
        }
        return result
    }
    avalon.ui.tooltip = function(element, id, vmodels, opts) {
        //有一个text 
        //data-tooltip-text="''" //字符串， 变量
        //data-tooltip-attr="title" // "title" 用于指定
        //data-tooltip-event="mouseover" 
        //data-tooltip-position="top left" 
        var obj = filterData(avalon(element).data(), "tooltip")
//        var arrowPositon = obj.position.match(/left|bottom|top|right/g) 
//        if(arrowPositon && arrowPositon.length){
//            
//        }
//                
//                || []"left bottom"
//        console.log(obj)


        var tooltip = '<div class="ui-tooltip ui-widget ui-corner-all ui-widget-content">' +
                '<div class="ui-tooltip-content">999999999998888</div></div>'
        tooltip = avalon.parseHTML(tooltip).firstChild

        document.body.appendChild(tooltip)
        avalon(tooltip).position({
            my: "left top+15",
            at: "left bottom",
            of: element
        })
        //  var arrow =  tooltip.getElementsByTagName("b")[0]

        var arrow = avalon.parseHTML('<b class="ui-tooltip-arrow ui-tooltip-big-arrow"></b>').firstChild
        document.body.appendChild(arrow)
        arrow.style.cssText += "z-index:10000;border-style:solid;border-color:  transparent transparent #aaa transparent;border-width: 0 5px 10px 5px"
        avalon(arrow).position({
            my: "bottom",
            at: "top",
            of: tooltip
        })
        var arrow2 = avalon.parseHTML('<b class="ui-tooltip-arrow ui-tooltip-big-arrow"></b>').firstChild
        document.body.appendChild(arrow2)
        arrow2.style.cssText += "z-index:10002;border-style:solid;border-color:  transparent transparent white transparent;border-width: 0 5px 10px 5px"
        avalon(arrow2).position({
            my: "bottom+5",
            at: "top",
            of: tooltip
        })
        // tooltip.style.dispaly = "block"

    }

    return avalon
})
/*
 <div ms-ui="tabs">
 <ul>
 <li>xxxxxxxxxxxx</li>
 <li>yyyyyyyyyyyyy</li>
 <li>zzzzzzzzzzzz</li>
 </ul>
 <div>
 xxx 第1个面板
 </div>
 <div>
 xxx 第2个面板
 </div>
 <div>
 xxx 第3个面板
 </div>
 </div>
 */