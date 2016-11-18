import { avalon } from '../../src/dom/shim/modern'
import { fixClone } from '../../src/dom/shim/fixClone'

import '../../src/dom/ready/modern'

describe('shim', function () {
    var clone
    beforeEach(function () {
        var div = document.createElement('div')
        div.innerHTML = heredoc(function () {
            /*
<textarea>222</textarea>
<input type="radio" value="333" checked="true"/>
<input type="checkbox" value="444" checked="true"/>
<select><option selected="true">333</option></select>
<object type="application/x-shockwave-flash" class="player" data="http://static.hdslb.com/play.swf" width="400" height="400" id="player_placeholder" style="visibility: visible;"><param name="bgcolor" value="#ffffff"><param name="allowfullscreeninteractive" value="true"><param name="allowfullscreen" value="true"><param name="quality" value="high"><param name="allowscriptaccess" value="always"><param name="wmode" value="direct"><param name="flashvars" value="cid=10999106&amp;aid=6754665&amp;lastplaytime=0&amp;player_type=1&amp;urlparam=module%3Dbangumi"></object>
            */
        })
        clone = fixClone(div)
    })
    it('avalon.cloneNode', function () {
        //注意,不要复制html元素 
        var div2 = document.createElement('map')
        var map = avalon.cloneNode(div2)
        expect(map.nodeName).toBe('MAP')

    })
    it('fixClone1', function () {

        var inputs = clone.getElementsByTagName('input')
        expect(inputs[0].checked).toBe(true)
        expect(inputs[1].checked).toBe(true)
        expect(inputs[0].value).toBe('333')
        expect(inputs[1].value).toBe('444')

    })
    it('fixClone2', function () {
        var option = clone.getElementsByTagName('option')[0]
        expect(option.selected).toBe(true)
        var textarea = clone.getElementsByTagName('textarea')[0]
        expect(textarea.value).toBe('222')
        var param = clone.getElementsByTagName('param')
        expect(param.length).toBe(7)
    })
    it('avalon.contains', function (done) {
        avalon.ready(function () {
            expect(avalon.contains(avalon.root, document.body)).toBe(true)
            done()
        })
    })
})
