define(["avalon", "avalon.button"], function(avalon) {
    var defaults = {
        toggle: true,
        width: 300,
        minHeight: 150,
        height: "auto",
        minWidth: 150,
        close: avalon.noop,
        parent: "body",
        modal: false,
        autoOpen: true
    };
    //判定是否支持css position fixed
    var supportFixed = true;
    new function() {
        var test = document.createElement('div'),
                control = test.cloneNode(false),
                fake = false,
                root = document.body || (function() {
            fake = true;
            return document.documentElement.appendChild(document.createElement('body'));
        }());
        var oldCssText = root.style.cssText;
        root.style.cssText = 'padding:0;margin:0';
        test.style.cssText = 'position:fixed;top:42px';
        root.appendChild(test);
        root.appendChild(control);
        supportFixed = test.offsetTop !== control.offsetTop;
        root.removeChild(test);
        root.removeChild(control);
        root.style.cssText = oldCssText;
        if (fake) {
            document.documentElement.removeChild(root);
        }
    };
    //遮罩层
    var overlay = document.createElement("div");
    overlay.innerHTML = '<div class="ui-widget-overlay ui-front">&nbsp;</div>';
    overlay = overlay.firstChild;//全部dialog共用
//判定是否支持css3 transform
    var transforms = {//IE9+ firefox3.5+ chrome4+ safari3.1+ opera10.5+
        "transform": "transform",
        "-moz-transform": "mozTransform",
        "-webkit-transform": "webkitTransform",
        "-ms-transform": "msTransform"
    }
    var cssText = "position:absolute; top:50%;left:50%;"
    var supportTransform = false;
    for (var i in transforms) {
        if (transforms[i] in overlay.style) {
            supportTransform = true;
            cssText += i + ":translate(-50%, -50%);"
            break;
        }
    }

    avalon.ui.dialog = function(element, id, vmodels, opts) {

        var $element = avalon(element);
        var options = avalon.mix({}, defaults, opts, $element.data());
        options.toggle = !!options.autoOpen;
        if (!options.title) {
            options.title = element.title || "&nbsp;";
        }
        if (typeof opts === "function") {
            options.close = opts;
        }
        var model;
        var dialog = avalon.parseHTML('<div class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-front dialog' + id +
                ' " tabindex="-1" style="position: absolute;" ' + //style="position: absolute;" 
                ' ms-visible="toggle"' +
                ' ms-css-width="width"' +
                ' ms-css-height="height"' +
                ' ms-draggable="draggend"' +
                ' data-before-start="beforeStart" ' +
                '><div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix"  data-beforestart="beforestart" data-movable="false">' +
                '<span class="ui-dialog-title" >{{title|html}}</span>' +
                '<button ms-ui="button" type="button" data-primary="ui-icon-closethick" class="ui-dialog-titlebar-close" data-text="false" ms-click="close">close</button></div>' +
                '</div></div>').firstChild;

        var parentNode = options.parent === "parent" ? element.parentNode : document.body;

        var full = false, addTransform = false
        $element.addClass("ui-dialog-content ui-widget-content");
        if (supportTransform) {
            var styleEl = "<style>.dialog" + id + "{" + cssText + "}</style>"
            styleEl = avalon.parseHTML(styleEl).firstChild

        }
        if (options.height === "auto") {
            var style = element.style;
            style.width = "auto";
            style.height = "auto";
            style.minHeight = element.clientHeight + "px";
        }
        element.removeAttribute("title");
        element.removeAttribute("ms-ui");//防止死循环
        element.parentNode.removeChild(element);
        model = avalon.define(id, function(vm) {
            vm.toggle = options.toggle;
            vm.title = options.title;
            vm.width = options.width;
            vm.height = options.height;
            vm.cssCenter = true;
            vm.close = function() {
                vm.toggle = false;
            };
            vm.draggend = avalon.noop
            vm.beforeStart = function(e, data) {
                vm.cssCenter = false;
                if (supportTransform) {
                    dialog.style.position = "absolute"
                    var target = avalon(dialog)
                    var startOffset = target.offset();
                    dialog.style.top = startOffset.top - data.marginTop + "px"
                    dialog.style.left = startOffset.left - data.marginLeft + "px"
                    if (styleEl) {
                        document.head.removeChild(styleEl)
                        styleEl = null
                    }
                }
            }
            vm.$watch("toggle", function(v) {
                if (v === false) {
                    avalon.Array.remove(overlayInstances, options);
                    if (!overlayInstances.length) {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }
                } else {
                    resetCenter();
                }
            });


        });
        function keepFocus() {
            function checkFocus() {
                var activeElement = document.activeElement,
                        isActive = dialog === activeElement || dialog.contains(activeElement);
                if (!isActive) {
                    if (dialog.querySelectorAll) {
                        var hasFocus = dialog.querySelectorAll("[autofocus]");
                        if (!hasFocus.length) {
                            hasFocus = dialog.querySelectorAll("[tabindex]");
                        }
                        if (!hasFocus.length) {
                            hasFocus = [dialog]
                        }
                        hasFocus[0].focus();
                    }
                }
            }
            checkFocus();
            avalon.nextTick(checkFocus);
        }

        function resetCenter() {
            if (model.cssCenter) {
                if (full) {//如果是基于窗口垂直居中
                    if (supportFixed) {
                        if (supportTransform) {
                            if (!addTransform) {
                                document.head.appendChild(styleEl)
                                addTransform = true
                            }
                        } else {
                            dialog.style.position = "fixed";
                            var l = (avalon(window).width() - dialog.offsetWidth) / 2;
                            var t = (avalon(window).height() - dialog.offsetHeight) / 2;
                            dialog.style.left = l + "px";
                            dialog.style.top = t + "px";
                        }
                    } else {//  如果是IE6，不支持fiexed，使用CSS表达式
                        dialog.style.setExpression('top', '( document.body.clientHeight - this.offsetHeight) / 2) + Math.max(document.documentElement.scrollTop,document.body.scrollTop) + "px"');
                        dialog.style.setExpression('left', '( document.body.clientWidth - this.offsetWidth / 2) +  Math.max(document.documentElement.scrollLeft,document.body.scrollLeft) + "px"');
                    }
                } else {//基于父节点的垂直居中
                    l = (avalon(parentNode).width() - dialog.offsetWidth) / 2;
                    t = (avalon(parentNode).height() - dialog.offsetHeight) / 2;
                    dialog.style.left = l + "px";
                    dialog.style.top = t + "px";
                }
            }
            keepFocus();
            if (options.modal) {
                parentNode.insertBefore(overlay, dialog);
                overlay.style.display = "block";
                avalon.Array.ensure(overlayInstances, options)
            }
        }

        avalon.ready(function() {
            parentNode.appendChild(dialog);
            dialog.appendChild(element);
            full = /body|html/i.test(dialog.offsetParent.tagName);
            if (full) {
                dialog.firstChild.setAttribute("data-containment", "window");//这是给ms-draggable组件用的
            }
            avalon.scan(dialog, [model].concat(vmodels));

            if (options.autoOpen) {
                avalon.nextTick(resetCenter);
            }
            if (full && supportTransform) {
                return
            }
            avalon(document.body).bind("scroll", function() {
                options.autoOpen && resetCenter();
            });
            avalon(window).bind("resize", function() {
                options.autoOpen && resetCenter();
            });
        });
        return model;
    }
    var overlayInstances = avalon.ui.dialog.overlayInstances = [];

    return avalon
})

//http://www.slipjs.com/jz.html