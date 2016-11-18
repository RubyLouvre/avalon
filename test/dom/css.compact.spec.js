import { avalon } from '../../src/seed/core'
import '../../src/dom/css/compact'

describe('css', function () {
    it('test', function () {
         var $root = avalon(avalon.root)
        expect( $root.position() ).toEqual({
            top: 0,
            left: 0
        })
        expect( $root.offsetParent()[0] ).toBe(avalon.root)
        expect( $root.css('color', 'red') ).toBe($root)
        expect( $root.css('color') ).toMatch(/red|rgb\(255,\s*0,\s*0\)/)
        $root.css('color', '')
        expect( avalon.root.style.color ).toBe('')
        expect( $root.offset() ).toEqual({left: 0, top: 0})
        
        expect( $root.css('opacity') ).toBe('1')
        $root.css('opacity', 0.55)
        //phantomjs在这里返回  0.550000011920929
        expect( $root.css('opacity') ).toMatch(/0\.55/)
        $root.css('opacity', '0.8')
        //phantomjs在这里返回 0.800000011920929
        expect( $root.css('opacity') ).toMatch(/0\.8/)
       $root.css('opacity', '0.823')
        //phantomjs在这里返回'0.8230000138282776
        expect( $root.css('opacity') ).toMatch(/0\.823/)
        expect( $root.css('top') ).toBe('0px')
        expect( $root.css('left') ).toBe('0px')
    })

})
