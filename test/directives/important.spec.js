import { avalon } from '../../src/seed/core'

describe('css', function () {

    var body = document.body, div, vm
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
        delete avalon.vmodels[vm.$id]
    })

    it('important', function (done) {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='ii1' >
              <p>{{@aaa}}</p>
               <div ms-important='ii2'>
                 <p>{{@aaa}}</p>
                  <div ms-important='ii3'>
                  <p>{{@aaa}}</p>
                  </div>
               </div>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'ii1',
            aaa: 'red'
        })
        var vm2 = avalon.define({
            $id: 'ii2',
            aaa: 'blue'
        })
        var vm3 = avalon.define({
            $id: 'ii3',
            aaa: 'green'
        })
        avalon.scan(div)
        var ps = document.getElementsByTagName("p")
        expect(ps[0].innerHTML).toBe('red')
        expect(ps[1].innerHTML).toBe('blue')
        expect(ps[2].innerHTML).toBe('green')
        vm.aaa = 'white'
        setTimeout(function () {

            expect(ps[0].innerHTML).toBe('white')
            expect(ps[1].innerHTML).toBe('blue')
            expect(ps[2].innerHTML).toBe('green')
            vm2.aaa = 'yellow'
            setTimeout(function () {
                expect(ps[0].innerHTML).toBe('white')
                expect(ps[1].innerHTML).toBe('yellow')
                expect(ps[2].innerHTML).toBe('green')
                delete avalon.vmodels.ii1
                delete avalon.vmodels.ii2
                delete avalon.vmodels.ii3
                done()
            }, 100)
        }, 100)

    })

    it('如果vm不存在不能扫描,直接抛错', function () {

        div.innerHTML = heredoc(function () {
            /*
             <div ms-controller='ii4' >
              <p>{{@aaa}}</p>
               <div ms-important='ii5'>
                 <p>{{@aaa}}</p>
   
               </div>
             </div>
             */
        })

        vm = avalon.define({
            $id: 'ii4',
            aaa: 'red'
        })
        var hasError = 0
        try{
        avalon.scan(div)
    }catch(e){
        hasError = 1
    }
        expect(hasError).toBe(1)
      
       

    })

})