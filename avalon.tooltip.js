define(["avalon.position"], function(avalon) {
    var defaults = {
        position: {
            my: "left top+15",
            at: "left bottom"
        }
    }
//所有绑定都依赖于某个绑定的某个属性，从而决定它的生命周期

    var styleEl = document.getElementById("avalonStyle")
    var text = ".ui-tooltip-arrow{z-index:1; position:absolute; top: -12px; left:0px;; height:0px; width:0px; font-size:0px; line-height:0px;border-width: 12px 0 0 12px;border-color: transparent transparent transparent #aaa;border-style:dashed dashed dashed  solid;}" +
            ".ui-tooltip-arrow2{z-index:2; position:absolute; top: -7px; left:2px;; height:0px; width:0px; font-size:0px; line-height:0px;border-width:8px 0 0 8px;border-color: transparent transparent transparent #fff;border-style:dashed dashed dashed solid;}"
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
        

        var tooltip = '<div class="ui-tooltip ui-widget ui-corner-all ui-widget-content"><div class="ui-tooltip-arrow"></div><div class="ui-tooltip-arrow2"></div><div class="ui-tooltip-content">999999999998888</div></div>'
        tooltip = avalon.parseHTML(tooltip).firstChild

        document.body.appendChild(tooltip)
        avalon(tooltip).position({
            my: "left top+15",
            at: "left bottom",
            of: element
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