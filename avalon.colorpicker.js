
//     http://www.knallgrau.at/code/colorpicker/demo
define(["avalon"], function(avalon) {
    var defaults = {
        imagesBase: "colorpicker/",
        toggle: false,
        top: 0,
        left: 0
    };
    var UI = avalon.ui["colorpicker"] = function(element, id, vmodels, opts) {
        var $element = avalon(element);
        var options = avalon.mix({}, defaults, $element.data());
        var domParser = document.createElement("div"), model;
        domParser.innerHTML = '<div ms-visible="toggle" ms-important="' + id + '" class="colorpicker ui-widget ui-widget-content ui-corner-all"><div class="colorpicker-div ui-corner-all" >' + (
                (typeof document.documentElement.style.maxHeight === 'undefined') ? // apply png fix for ie 5.5 and 6.0
                '<img class="colorpicker-bg" src="' + options.imagesBase + 'blank.gif" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + options.imagesBase + 'pickerbg.png\', sizingMethod=\'scale\')" alt="">' :
                '<img class="colorpicker-bg" src="' + options.imagesBase + 'pickerbg.png" alt="">'
                ) +
                '<div class="colorpicker-bg-overlay" style="z-index: 1002;"></div>' +
                '<div class="colorpicker-selector" ms-draggable="updateSelector" data-containment="parent" ms-css-left="selectorLeft" ms-css-top="selectorTop" ><img src="' + options.imagesBase + 'select.gif" width="11" height="11" alt="" /></div></div>' +
                '<div class="colorpicker-hue-container"><img src="' + options.imagesBase + 'hue.png" class="colorpicker-hue-bg-img"><div class="colorpicker-hue-slider">' +
                '<div class="colorpicker-hue-thumb" ms-css-top="hueValue" ms-draggable="updateHue" data-containment="parent" data-axis="y"><img src="' + options.imagesBase + 'hline.png"></div></div></div>' +
                '<div class="colorpicker-footer "><span class="colorpicker-value" ms-css-color="#{{hexValue}}">#{{hexValue}}</span>' +
                '<button class="colorpicker-okbutton" ms-click="closePicker" ms-ui="button"  data-primary="ui-icon-close" data-text="false">OK</button></div></div>';
        var colorpicker = domParser.firstChild;
        var pickerArea = colorpicker.children[0];
        avalon.ready(function() {
            document.body.appendChild(colorpicker);
            avalon.scan(element, model);
            avalon.scan(colorpicker, model);
            $element.bind("click", function() {
                model.toggle = !model.toggle;
                model.pickerHeight = pickerArea.offsetHeight;
                model.pickerWidth = pickerArea.offsetWidth;
                if (model.toggle) {
                    var offset = $element.offset();
                    var left = offset.left + element.offsetWidth + 10;
                    colorpicker.style.left = left + "px";
                    colorpicker.style.top = offset.top + "px";
                }
            });
        });

        model = avalon.define(id, function(vm) {
            vm.toggle = options.toggle;

            vm.selectorLeft = 0;
            vm.selectorTop = 0;

            vm.pickerHeight = 0;
            vm.pickerWidth = 0;
            vm.hueValue = 0;
           // vm.hexColor = "000"
            vm.hexValue = element.value;
            vm.$hsv = {};
            vm.$rgb = {};
            vm.closePicker = function() {
                vm.toggle = false;
            };
            vm.updateSelector = function(event, data) {
                options.left = data.left;
                options.top = data.top;
                this.style.top = data.top + 6 + "px";
                this.style.left = data.left + 6  + "px";
                vm.update(data.left, data.top);
            };
            vm.updateHue = function(event, data) {
                var v = data.top;
                vm.hueValue = v;
                var h = (vm.pickerHeight - v) / vm.pickerHeight;
                if (h === 1)
                    h = 0;
                var rgb = UI.Color.hsv2rgb(h, 1, 1);
                if (!UI.Color.isValidRGB(rgb))
                    return;
                pickerArea.style.backgroundColor = "rgb(" + rgb + ")";
                vm.update();
            };
            vm.update = function(x, y) {
                if (!arguments.length) {
                    x = options.left;
                    y = options.top;
                }
                var h = (vm.pickerHeight - vm.hueValue) / vm.pickerHeight;
                if (h === 1) {
                    h = 0;
                }
                vm.$hsv = {
                    hue: 1 - vm.hueValue / 100,
                    saturation: x / vm.pickerWidth,
                    brightness: (vm.pickerHeight - y) / vm.pickerHeight
                };
                var rgb = UI.Color.hsv2rgb(vm.$hsv.hue, vm.$hsv.saturation, vm.$hsv.brightness);
                element.value = UI.Color.rgb2hex(rgb[0], rgb[1], rgb[2]);
                vm.hexValue = element.value;
              //  vm.hexColor = vm.$hsv.brightness > 0.65 ? "000000" : "FFFFFF";
            };
            vm.updateFromFieldValue = function(e) {
                var input = e ? e.target : element;
                var rgb = UI.Color.hex2rgb(input.value);
                if (!UI.Color.isValidRGB(rgb))
                    return;
                var hsv = UI.Color.rgb2hsv(rgb[0], rgb[1], rgb[2]);
                vm.selectorLeft = Math.round(hsv[1] * vm.pickerWidth);
                vm.selectorTop = Math.round((1 - hsv[2]) * vm.pickerWidth);
                vm.hueValue = vm.pickerHeight * (1 - hsv[0]);
                vm.update();
            }
            vm.$watch("toggle", function() {
                vm.updateFromFieldValue()
            });
        });


    };


    UI.Color = new function() {

        // Adapted from http://www.easyrgb.com/math.html
        // hsv values = 0 - 1
        // rgb values 0 - 255
        this.hsv2rgb = function(h, s, v) {
            var r, g, b;
            if (s == 0) {
                r = v * 255;
                g = v * 255;
                b = v * 255;
            } else {

                // h must be < 1
                var var_h = h * 6;
                if (var_h == 6) {
                    var_h = 0;
                }

                //Or ... var_i = floor( var_h )
                var var_i = Math.floor(var_h);
                var var_1 = v * (1 - s);
                var var_2 = v * (1 - s * (var_h - var_i));
                var var_3 = v * (1 - s * (1 - (var_h - var_i)));

                if (var_i == 0) {
                    var_r = v;
                    var_g = var_3;
                    var_b = var_1;
                } else if (var_i == 1) {
                    var_r = var_2;
                    var_g = v;
                    var_b = var_1;
                } else if (var_i == 2) {
                    var_r = var_1;
                    var_g = v;
                    var_b = var_3
                } else if (var_i == 3) {
                    var_r = var_1;
                    var_g = var_2;
                    var_b = v;
                } else if (var_i == 4) {
                    var_r = var_3;
                    var_g = var_1;
                    var_b = v;
                } else {
                    var_r = v;
                    var_g = var_1;
                    var_b = var_2
                }

                r = var_r * 255          //rgb results = 0 � 255
                g = var_g * 255
                b = var_b * 255

            }
            return [Math.round(r), Math.round(g), Math.round(b)];
        };

        // added by Matthias Platzer AT knallgrau.at 
        this.rgb2hsv = function(r, g, b) {
            var r = (r / 255);                   //RGB values = 0 � 255
            var g = (g / 255);
            var b = (b / 255);

            var min = Math.min(r, g, b);    //Min. value of RGB
            var max = Math.max(r, g, b);    //Max. value of RGB
            deltaMax = max - min;             //Delta RGB value

            var v = max;
            var s, h;
            var deltaRed, deltaGreen, deltaBlue;

            if (deltaMax == 0)                     //This is a gray, no chroma...
            {
                h = 0;                               //HSV results = 0 � 1
                s = 0;
            }
            else                                    //Chromatic data...
            {
                s = deltaMax / max;

                deltaRed = (((max - r) / 6) + (deltaMax / 2)) / deltaMax;
                deltaGreen = (((max - g) / 6) + (deltaMax / 2)) / deltaMax;
                deltaBlue = (((max - b) / 6) + (deltaMax / 2)) / deltaMax;

                if (r == max)
                    h = deltaBlue - deltaGreen;
                else if (g == max)
                    h = (1 / 3) + deltaRed - deltaBlue;
                else if (b == max)
                    h = (2 / 3) + deltaGreen - deltaRed;

                if (h < 0)
                    h += 1;
                if (h > 1)
                    h -= 1;
            }

            return [h, s, v];
        }

        this.rgb2hex = function(r, g, b) {
            return this.toHex(r) + this.toHex(g) + this.toHex(b);
        };

        this.hexchars = "0123456789ABCDEF";

        this.toHex = function(n) {
            n = n || 0;
            n = parseInt(n, 10);
            if (isNaN(n))
                n = 0;
            n = Math.round(Math.min(Math.max(0, n), 255));

            return this.hexchars.charAt((n - n % 16) / 16) + this.hexchars.charAt(n % 16);
        };

        this.toDec = function(hexchar) {
            return this.hexchars.indexOf(hexchar.toUpperCase());
        };

        this.hex2rgb = function(str) {
            var rgb = [];
            rgb[0] = (this.toDec(str.substr(0, 1)) * 16) +
                    this.toDec(str.substr(1, 1));
            rgb[1] = (this.toDec(str.substr(2, 1)) * 16) +
                    this.toDec(str.substr(3, 1));
            rgb[2] = (this.toDec(str.substr(4, 1)) * 16) +
                    this.toDec(str.substr(5, 1));
            return rgb;
        };

        this.isValidRGB = function(a) {
            if ((!a[0] && a[0] != 0) || isNaN(a[0]) || a[0] < 0 || a[0] > 255)
                return false;
            if ((!a[1] && a[1] != 0) || isNaN(a[1]) || a[1] < 0 || a[1] > 255)
                return false;
            if ((!a[2] && a[2] != 0) || isNaN(a[2]) || a[2] < 0 || a[2] > 255)
                return false;

            return true;
        };
    }

    return avalon
})
