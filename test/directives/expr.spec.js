import { avalon } from '../../src/seed/core'

describe('expr', function () {
 var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        if (div.parentNode === body) {
            body.removeChild(div)
            delete avalon.vmodels[vm.$id]
        }
    })
    it('两个插值在同一文本节点中', function () {
    
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text1">{{@aa_bb}}+{{@bbb}}</div>
            */
        })
        vm = avalon.define({
            $id: 'text1',
            aa_bb: 111,
            bbb: 222
        })
        avalon.scan(div)
        //IE6-8需要处理标签名的大写化
        expect(getInnerHTML(div)).toBe('<div>111+222</div>')
        vm.aa_bb = '司徒正美'
        expect(getInnerHTML(div)).toBe('<div>司徒正美+222</div>')
    })

    it('存在过滤器', function () {
       
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text2">{{@aaa | uppercase}}+{{@bbb}}</div>
            */
        })
         vm = avalon.define({
            $id: 'text2',
            aaa: 'aaa',
            bbb: 222
        })
        avalon.scan(div)
        expect(div.innerHTML.
                replace(/DIV/g,'div').
                replace(/\s*class=""/,'')).toBe('<div>AAA+222</div>')
      
    })

    it('存在多个过滤器', function () {
      
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text3">{{@aaa | uppercase | truncate(7)}}+{{@bbb | date("yyyy-MM-dd")}}</div>
            */
        })
        vm = avalon.define({
            $id: 'text3',
            aaa: 'ae4dfdsfd',
            bbb: 1477928314673
        })
        avalon.scan(div)
        expect(div.innerHTML.
                replace(/DIV/g,'div').
                replace(/\s*class=""/,'')
                ).toBe('<div>AE4D...+2016-10-31</div>')
        
    })
    it('存在加减时的优先级问题', function () {
      //https://github.com/RubyLouvre/avalon/issues/1839
        div.innerHTML = heredoc(function () {
            /*
            <div ms-controller="text4">XXX{{@aaa + 1}}YYY</div>
            */
        })
        vm = avalon.define({
            $id: 'text4',
            aaa: 33
        })
        avalon.scan(div)
        expect(div[textProp]).toBe('XXX34YYY')
        
    })
    
   
})