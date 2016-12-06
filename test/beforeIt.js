function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
function getInnerHTML(el){
   return el.innerHTML.toLowerCase().replace(/\s*class=""/,'')
}
var textProp = 'textContent' in document ? 'textContent': 'innerText'
function fireClick(el) {
    if (el.click) {
        el.click()
    }else {
//https://developer.mozilla.org/samples/domref/dispatchEvent.html
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        !el.dispatchEvent(evt);
    }
}

  var dddDIV = document.getElementById('aaa')
  var expect1 = function(a){
      return {
          toBe: function(b){
              console.log(a, b, a=== b)
          }
      }
  }