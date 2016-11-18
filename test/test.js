describe('add', function () {
    it('should add two numbers and return the result', function () {
        expect(window.add(1, 2)).toBe(3);
    });
});

describe('subtract', function () {
    it('should subtract two numbers', function () {
        expect(window.subtract(2, 1)).toBe(1);
    });
});

describe('innerHTML', function () {
    it('should subtract two numbers', function (done) {
        var div = document.createElement('div')
        div.style.cssText = 'width:300px;height:300px;background:red'
        document.body.appendChild(div)
        div.innerHTML = 'test3'
        setTimeout(function(){
            expect(div.innerHTML).toBe('test3'); 
            done()
        },3000)
       
    });
});