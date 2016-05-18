;(function(win, lib) {
    var doc = win.document;
    var docEl = doc.documentElement;
    var dpr = 0;
    var tid;
    var flexible = lib.flexible || (lib.flexible = {});
    var isIPhone = win.navigator.appVersion.match(/iphone/gi);
    var devicePixelRatio = win.devicePixelRatio;
    if (isIPhone) {
        // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
        if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {                
            dpr = 3;
        } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
            dpr = 2;
        } else {
            dpr = 1;
        }
    } else {
        // 其他设备下，仍旧使用1倍的方案
        dpr = 1;
    }
    //html 设置data-dpr
    docEl.setAttribute('data-dpr', dpr);
    //把body的fontSize设置为12px,可以直接在css里直接设置body的font-size为12px,设置body的font-size目的是为了消除在html标签上设置了font-size对body里的渲染的影响
    if (doc.readyState === 'complete') {
        doc.body.style.fontSize = 12 + 'px';
    } else {
        doc.addEventListener('DOMContentLoaded', function( ) {
            doc.body.style.fontSize = 12 + 'px';
        }, false);
    }
 
    function refreshRem(){
        var width = docEl.getBoundingClientRect().width;
        var rem = width / 6.4;
        //iPhone4，5是32px，iPhone6是37.5px，iPhone6 Plus 是41.4px
        docEl.style.fontSize = rem + 'px';
        flexible.rem = win.rem = rem;
    }
    var evt = "onorientationchange" in window ? "orientationchange" : "resize"
    win.addEventListener(evt, function() {
        clearTimeout(tid);
        tid = setTimeout(refreshRem, 300);
    }, false);
    win.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            clearTimeout(tid);
            tid = setTimeout(refreshRem, 300);
        }
    }, false);
    
    //初始化rem
    refreshRem();
 
    flexible.dpr = win.dpr = dpr;
    flexible.refreshRem = refreshRem;
    flexible.rem2px = function(d) {
        var val = parseFloat(d) * this.rem;
        if (typeof d === 'string' && d.match(/rem$/)) {
            val += 'px';
        }
        return val;
    }
    flexible.px2rem = function(d) {
        var val = parseFloat(d) / this.rem;
        if (typeof d === 'string' && d.match(/px$/)) {
            val += 'rem';
        }
        return val;
    }
 
})(window, window['lib'] || (window['lib'] = {}));