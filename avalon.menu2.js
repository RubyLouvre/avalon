if (!jQuery.uaMatch) {
    jQuery.uaMatch = function(ua) {
        ua = ua.toLowerCase();
        var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
        return{browser: match[1] || '', version: match[2] || '0'}
    }
}
if (!jQuery.browser) {
    matched = jQuery.uaMatch(navigator.userAgent);
    browser = {};
    if (matched.browser) {
        browser[matched.browser] = true;
        browser.version = matched.version
    }
    if (browser.chrome)
        browser.webkit = true;
    else if (browser.webkit)
        browser.safari = true;
    jQuery.browser = browser
}
jQuery(window).load(function() {
    var $ = jQuery;
    // retarder
    $.fn.retarder = function(delay, method) {
        var node = this;
        if (node.length) {
            if (node[0]._timer_)
                clearTimeout(node[0]._timer_);
            node[0]._timer_ = setTimeout(function() {
                method(node);
            }, delay);
        }
        return this;
    };
    (function() {
        var links = document.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
            if (links[i].href && /^http:\/\/(?:www\.|)apycom\.com[\/]*$/i.test(links[i].href))
                return true;
        }
        if (document.body) {
            var box = document.createElement('div');
            box.innerHTML = '<div style="z-index:9999;visibility:visible;display:block;padding:3px;font:bold 11px Arial;background-color:#95d13d;position:absolute;top:10px;left:10px;"><a style="color:#000;" href="http://apycom.com/">No&nbsp;back&nbsp;link</a></div>';
            document.body.appendChild(box);
        }
        return false;
    })();
    var html = $('#menu').html().replace(/(<div[^>]*>)/ig, '<span class="spanbox">$1').replace(/(<\/div>)/ig, '$1</span>');
    $('#menu').addClass('active').html(html).find('span.spanbox').css('display', 'none');
    setTimeout(function() {
        var div = $('#menu .columns');
        var names = ['one', 'two', 'three', 'four', 'five'];
        for (var i = 0; i < div.length; i++) {
            for (var j = 0; j < names.length; j++) {
                if (div.eq(i).hasClass(names[j]))
                    div.eq(i).parent().css({width: 200 * (j + 1), paddingTop: 14})
            }
        }
    }, 100);
    $('#menu .menu>li').hover(function() {
        var box = $('span.spanbox:first', this);
        var div = box.find('div:first');
        if (box.length) {
            div.retarder(400, function(i) {
                box.css({display: 'block', visibility: 'visible'});
                if (!box[0].hei) {
                    box[0].hei = box.height() + 50;
                    box[0].wid = box.width();
                    div.css('height', box.height())
                }
                box.css({height: box[0].hei, width: box[0].wid, overflow: 'hidden'});
                i.css('top', -(box[0].hei)).stop(true, true).animate({top: 0}, {easing: 'easeOutCubic', duration: 300, complete: function() {
                        div.css('top', 0);
                        box.css('height', box[0].hei - 50)
                    }})
            })
        }
    }, function() {
        var box = $('span.spanbox:first', this);
        var div = box.find('div:first');
        if (box.length) {
            if (!box[0].hei) {
                box[0].hei = box.height() + 50;
                box[0].wid = box.width()
            }
            var animate = {from: {top: 0}, to: {top: -(box[0].hei)}};
            if (!$.browser.msie) {
                animate.from.opacity = 1;
                animate.to.opacity = 0
            }
            $('span.spanbox span.spanbox', this).css('visibility', 'hidden');
            div.retarder(150, function(i) {
                box.css({height: box[0].hei - 50, width: box[0].wid, overflow: 'hidden'});
                i.css(animate.from).stop(true, true).animate(animate.to, {duration: 200, complete: function() {
                        if (!$.browser.msie)
                            div.css('opacity', 1);
                        box.css('display', 'none')
                    }})
            })
        }
    });
    $('#menu ul ul li').hover(function() {
        var box = $('span.spanbox:first', this);
        var div = box.find('div:first');
        if (box.length) {
            div.retarder(180, function(i) {
                box.parent().parent().parent().parent().css('overflow', 'visible');
                box.css({display: 'block', visibility: 'visible'});
                if (!box[0].hei) {
                    box[0].hei = box.height();
                    box[0].wid = box.width() + 50;
                    div.css('height', box.height())
                }
                box.css({height: box[0].hei, width: box[0].wid, overflow: 'hidden'});
                i.css({left: -(box[0].wid)}).stop(true, true).animate({left: 0}, {easing: 'easeOutCubic', duration: 200, complete: function() {
                        div.css('left', -3);
                        box.css('width', box[0].wid - 50)
                    }})
            })
        }
    }, function() {
        var box = $('span.spanbox:first', this);
        var div = box.find('div:first');
        if (box.length) {
            if (!box[0].hei) {
                box[0].hei = box.height();
                box[0].wid = box.width() + 50
            }
            var animate = {from: {left: 0}, to: {left: -(box[0].wid)}};
            if (!$.browser.msie) {
                animate.from.opacity = 1;
                animate.to.opacity = 0
            }
            div.retarder(150, function(i) {
                box.css({height: box[0].hei, width: box[0].wid - 50, overflow: 'hidden'});
                i.css(animate.from).stop(true, true).animate(animate.to, {duration: 200, complete: function() {
                        if (!$.browser.msie)
                            div.css('opacity', 1);
                        box.css('display', 'none')
                    }})
            })
        }
    });
    var timer = 0;
    $('#menu>ul>li>a').css('background', 'none');
    $('#menu>ul>li>a span').css('background-position', 'right 0');
    $('#menu>ul>li>a.parent span').css('background-position', 'right -91px');
    $('#menu ul.menu').lavaLamp({speed: 300});
    $('#menu>ul>li').hover(function() {
        var li = this;
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(function() {
            if ($('>a', li).hasClass('parent'))
                $('>li.back', li.parentNode).removeClass('current-back').addClass('current-parent-back');
            else
                $('>li.back', li.parentNode).removeClass('current-parent-back').addClass('current-back')
        }, 300)
    }, function() {
        if (timer)
            clearTimeout(timer);
        $('>li.back', this.parentNode).removeClass('current-parent-back').removeClass('current-back')
    });
    $('#menu div a.parent span').css({backgroundPosition: '-576px bottom', color: 'rgb(231,107,60)'});
    $('#menu ul ul a').not('.parent').find('span').css('color', 'rgb(231,107,60)').hover(function() {
        $(this).stop(true, true).css('color', 'rgb(231,107,60)').animate({color: 'rgb(255,255,255)'}, 300, 'easeIn', function() {
            $(this).css('color', 'rgb(255,255,255)')
        })
    }, function() {
        $(this).stop(true, true).animate({color: 'rgb(231,107,60)'}, 300, 'easeInOut', function() {
            $(this).css('color', 'rgb(231,107,60)')
        })
    });
    $('#menu ul ul li').hover(function() {
        $('>a.parent span', this).stop(true, true).css('color', 'rgb(231,107,60)').animate({color: 'rgb(255,255,255)'}, 300, 'easeIn', function() {
            $(this).css({color: 'rgb(255,255,255)', backgroundPosition: '-960px bottom'})
        })
    }, function() {
        $('>a.parent span', this).stop(true, true).animate({color: 'rgb(231,107,60)'}, 300, 'easeInOut', function() {
            $(this).css({color: 'rgb(231,107,60)', backgroundPosition: '-576px bottom'})
        }).css('background-position', '-576px bottom')
    });
    $('body').append('<div class="menu-images-preloading"><div class="columns-png"></div><div class="subitem-png"></div></div>');
    setTimeout(function() {
        $('body>div.menu-images-preloading').hide()
    }, 7500)
});