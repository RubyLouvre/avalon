import { avalon } from '../../src/seed/core'

describe('text', function () {
    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })
    it('test', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='text1' ms-text='@aa'>{{@bb}}</div>
             */
        })
        vm = avalon.define({
            $id: 'text1',
            aa: '清风炎羽',
            bb: '司徒正美'
        })
        avalon.scan(div)
        expect(div.children[0].innerHTML).toBe('清风炎羽')
        vm.aa = '新的内容'
        setTimeout(function () {
            expect(div.children[0].innerHTML).toBe('新的内容')
            done()
        })

    })
     it('测试date过滤器', function (done) {
        div.innerHTML = heredoc(function () {
            /*
             <div :controller='text2' :text="@aa | date('yyyy-MM-dd')">{{@bb}}</div>
             */
        })
        vm = avalon.define({
            $id: 'text2',
            aa: new Date(2007,8,9)-0, 
            bb: '司徒正美'
        })
        avalon.scan(div)
        expect(div.children[0].innerHTML).toBe('2007-09-09')
        vm.aa = new Date(2007,5,1)-0
        setTimeout(function () {
            expect(div.children[0].innerHTML).toBe('2007-06-01')
            done()
        })

    })
    
     it('voidTag', function () {
       
        div.innerHTML = heredoc(function () {
            /*
            <br ms-controller="text3" ms-text='@aaa' />
            */
        })
        vm = avalon.define({
            $id: 'text3',
            aaa: 'xxxxx',
            bbb: 222
        })
        try{
        avalon.scan(div)
    }catch(e){
        expect(div.innerHTML).not.toMatch(/xxxxx/i)
    }
    })
})