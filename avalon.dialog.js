(function(avalon) {
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
    var positionfixed = true;
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
        positionfixed = test.offsetTop !== control.offsetTop;
        root.removeChild(test);
        root.removeChild(control);
        root.style.cssText = oldCssText;
        if (fake) {
            document.documentElement.removeChild(root);
        }
    };
    if (window.Node && Node.prototype && !Node.prototype.contains) {
        Node.prototype.contains = function(arg) {
            return !!(this.compareDocumentPosition(arg) & 16);
        };
    }
    var domParser = document.createElement("div");
    domParser.innerHTML = '<div class="ui-widget-overlay ui-front">&nbsp;</div>';
    var overlay = domParser.firstChild;//全部dialog共用
    avalon.ui.dialog = function(element, id, opts, model) {
        var $element = avalon(element);
        var options = avalon.mix({}, defaults);
        avalon.mix(options, $element.data());
        options.toggle = !!options.autoOpen;
        if (!options.title) {
            options.title = element.title || "&nbsp;";
        }
        if (typeof opts === "function") {
            options.close = opts;
        }
        if (typeof opts === "object") {
            for (var i in opts) {
                if (i === "$id")
                    continue;
                options[i] = opts[i];
            }
        }

        var model;
        domParser.innerHTML = '<div class="ui-dialog ui-widget ui-widget-content ui-corner-all ui-front" tabindex="-1" style="position: absolute;" ' +
                ' ms-visible="toggle"' +
                ' ms-css-width="width"' +
                ' ms-css-height="height"' +
                '><div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix" ms-draggable="drag" data-beforestart="beforestart" data-movable="false">' +
                '<span class="ui-dialog-title" ms-html="title"></span>' +
                '<button ms-ui="button" type="button" data-primary="ui-icon-closethick" class="ui-dialog-titlebar-close" data-text="false" ms-click="close">close</button></div>' +
                '</div></div>';
        var dialog = domParser.firstChild;
        if (options.nodeNodeType === 1) {
            var parent = options.parent;
        } else {
            var parent = options.parent === "parent" ? element.parentNode : document.body;
        }
        var full = false;
        $element.addClass("ui-dialog-content ui-widget-content");
        if (options.height === "auto") {
            var style = element.style;
            style.width = "auto";
            style.height = "auto";
            style.minHeight = element.clientHeight + "px";
        }
        element.removeAttribute("title");
        element.parentNode.removeChild(element);
        model = avalon.define(id, function(vm) {
            vm.toggle = options.toggle;
            vm.title = options.title;
            vm.width = options.width;
            vm.height = options.height;
            vm.close = function() {
                vm.toggle = false;
            };
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
            vm.drag = function(event, data) {
                dialog.style.top = data.top + "px";
                dialog.style.left = data.left + "px";
            };
            vm.beforestart = function(event, data) {
                data.element = dialog;
                data.$element = avalon(dialog);

            };
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
            if (full) {
                if (positionfixed) {
                    dialog.style.position = "fixed";
                    var l = (avalon(window).width() - dialog.offsetWidth) / 2;
                    var t = (avalon(window).height() - dialog.offsetHeight) / 2;
                } else {
                    dialog.style.setExpression('top', '( document.body.clientHeight - this.offsetHeight) / 2) + Math.max(document.documentElement.scrollTop,document.body.scrollTop) + "px"');
                    dialog.style.setExpression('left', '( document.body.clientWidth - this.offsetWidth / 2) +  Math.max(document.documentElement.scrollLeft,document.body.scrollLeft) + "px"');
                    return;
                }
            } else {
                l = (avalon(parent).width() - dialog.offsetWidth) / 2;
                t = (avalon(parent).height() - dialog.offsetHeight) / 2;
            }
            dialog.style.left = l + "px";
            dialog.style.top = t + "px";
            keepFocus();
            if (options.modal) {
                parent.insertBefore(overlay, dialog);
                overlay.style.display = "block";
                avalon.Array.ensure(overlayInstances, options)
            }
        }
        avalon.ready(function() {
            parent.appendChild(dialog);
            dialog.appendChild(element);
            full = /body|html/i.test(dialog.offsetParent.tagName);
            if (full) {
                dialog.firstChild.setAttribute("data-containment", "window");
            }
            avalon.scan(dialog, model);
            if (options.autoOpen) {
                avalon.nextTick(resetCenter);
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

})(window.avalon);
//http://www.slipjs.com/jz.html