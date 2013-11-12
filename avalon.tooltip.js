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
    var rposition = /left|bottom|top|right|center/g
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
        var cmy, cat, borderWidth
        var positionAt = obj.positionAt
        var positionMy = obj.positionMy
        var borderColor = ["transparent", "transparent", "transparent", "transparent"]
        var bpx = "10px", mpx = "5px", spx = "0"
        var color = "red"

//http://qtip2.com/options
        var p = obj.position || ""
        switch (p) {
            case "tc"://正上方
                cat = "center top"
                cmy = "center bottom"
                borderWidth = [bpx, mpx, spx, mpx]
                borderColor[0] = color
                break;
            case "tl": //上方靠左
                cat = "left top"
                cmy = "left bottom"
                borderWidth = [bpx, bpx, spx, spx]
                borderColor[0] = color
                break
            case "tr": //上方靠右
                cat = "right top"
                cmy = "right bottom"
                borderWidth = [spx, bpx, bpx, spx]
                borderColor[1] = color
                break
            case "lt"://左方靠上
                cat = "left top"
                cmy = "right top"
                borderWidth = [bpx, bpx, spx, spx]
                borderColor[0] = color
                break
            case "lc"://正左方
                cat = "left center"
                cmy = "right center"
                borderWidth = [mpx, spx, mpx, bpx]
                borderColor[3] = color
                break
            case "lb"://左方靠下
                cat = "left bottom"
                cmy = "right bottom"
                borderWidth = [bpx, spx, spx, bpx]
                borderColor[3] = color
                break
            case "rt"://右方靠上
                cat = "right top"
                cmy = "left top"
                borderWidth = [spx, bpx, bpx, spx]
                borderColor[1] = color
                break
            case "rc"://正右方
                cat = "right center"
                cmy = "left center"
                borderWidth = [mpx, bpx, mpx, spx]
                borderColor[1] = color
                break
            case "rb"://右方靠下
                cat = "right bottom"
                cmy = "left bottom"
                borderWidth = [spx, spx, bpx, bpx]
                borderColor[2] = color
                break
            case "bl"://下方靠左
                cat = "left bottom"
                cmy = "left top"
                borderWidth = [bpx, spx, spx, bpx]
                borderColor[3] = color
                break
            case "bc"://正下方
                cat = "center bottom"
                cmy = "center top"
                borderWidth = [spx, mpx, bpx, mpx]
                borderColor[2] = color
                break
            case "br"://下方靠厍
                cat = "right bottom"
                cmy = "right top"
                borderWidth = [spx, spx, bpx, bpx]
                borderColor[2] = color
                break
            case "cc"://居中
                cmy = cat = "center center"
                break
        }


        if (p.charAt(0) === "b") {
            cmy += "+10"
        }

        // alert(cmy)



        var tooltip = '<div class="ui-tooltip ui-widget ui-corner-all ui-widget-content">' +
                '<div class="ui-tooltip-content">999999999998888</div></div>'
        tooltip = avalon.parseHTML(tooltip).firstChild

        document.body.appendChild(tooltip)
        color = avalon(tooltip).css("border-top-color")
        borderColor = borderColor.join(" ").replace("red", avalon(tooltip).css("border-top-color"))

        //my 决定箭头的坐标与有无

        avalon(tooltip).position({
            at: cat,
            my: cmy,
            of: element,
            collision: "none"
        })
        cmy = cmy.replace(/[-+\d]/g, "")

        //  var arrow =  tooltip.getElementsByTagName("b")[0]
        //如果用户传bottom 相当于为bottom center,那么at为top+ah
        var a = avalon(tooltip).css("border-bottom-width")
        //   alert(a)
        var arrow = avalon.parseHTML('<b class="ui-tooltip-arrow ui-tooltip-big-arrow"></b>').firstChild
        document.body.appendChild(arrow)
        arrow.style.cssText += "z-index:10005;border-style:solid;border-color: " + borderColor + ";border-width: " + borderWidth.join(" ")
        avalon(arrow).position({
            my: cat,
            at: cmy,
            of: tooltip
        })
        var arrow2 = avalon.parseHTML('<b class="ui-tooltip-arrow ui-tooltip-big-arrow"></b>').firstChild
        document.body.appendChild(arrow2)
//        arrow2.style.cssText += "z-index:10002;border-style:solid;border-color:  transparent transparent white transparent;border-width: 0 5px 10px 5px"
//        avalon(arrow2).position({
//            my: "bottom+4",
//            at: "top",
//            of: tooltip
//        })
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