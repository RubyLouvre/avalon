import { createGetter, createSetter, addScope } from '../../src/parser/index'

describe('parser', function() {
    it('test', function() {
        var a = createGetter("ssss throw eee ")
        expect(a).toBe(avalon.noop)
        var b = createSetter("ssss throw eee ")
        expect(b).toBe(avalon.noop)
    })

    it('处理正则', function() {
        var arr = addScope("{required:true,pattern:/[\u4e00-\u9fa5a-z]{2-8}/i}")
        expect(arr[0]).toBe('{required :true,pattern :/[\u4e00-\u9fa5a-z]{2-8}/i }')

    })
    it('处理数组', function() {
        var arr = addScope("[{is:'ms-address-wrap', $id:'address'}]")
        expect(arr[0]).toBe("[{is :'ms-address-wrap' ,$id :'address' }]")

    })

    it('avalon.lexer', function() {
        var str = `<div><tr><td>{{ el['a'] }}</td><td>{{ el['b'] }}</td><td>{{ el['c'] }}</td></tr><!--for3061628999--></div>`
        var a = avalon.lexer(str)
        expect(a).toEqual([{
            nodeName: 'div',
            props: {},
            children: [{
                nodeName: "tr",
                props: {},
                children: [{
                    nodeName: 'td',
                    props: {},
                    children: [{
                        nodeName: "#text",
                        nodeValue: "{{ el['a'] }}"
                    }]
                }, {
                    nodeName: 'td',
                    props: {},
                    children: [{
                        nodeName: "#text",
                        nodeValue: "{{ el['b'] }}"
                    }]
                }, {
                    nodeName: 'td',
                    props: {},
                    children: [{
                        nodeName: "#text",
                        nodeValue: "{{ el['c'] }}"
                    }]
                }]
            }, {
                nodeName: '#comment',
                nodeValue: 'for3061628999'
            }]
        }])

    })
})