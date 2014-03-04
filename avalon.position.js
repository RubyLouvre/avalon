define(["avalon"], function(avalon) {
    var cachedScrollbarWidth,
            abs = Math.abs,
            round = Math.round,
            rhorizontal = /left|center|right/,
            rvertical = /top|center|bottom/,
            roffset = /[\+\-]\d+(\.[\d]+)?%?/,
            rposition = /^\w+/,
            rpercent = /%$/,
            cachedScrollbarWidth,
            oldPosition = avalon.fn.position,
            oldOffset = avalon.fn.offset;

    avalon.fn.offset = function(options) {
        if (avalon.type(options) === "object") {
            return setOffset.call(this, options)
        }
        return  oldOffset.call(this)
    }

    var myAt = ["my", "at"]
    function setPosition(options) {
        // make a copy, we don't want to modify arguments
        options = avalon.mix({}, options);

        var atOffset, targetWidth, targetHeight, targetOffset, basePosition, dimensions,
                target = avalon(options.of), //这是作为基准的对象
                within = getWithinInfo(options.within), //如果没有指定，默认为window
                scrollInfo = getScrollInfo(within),
                collision = (options.collision || "flip").split(" "),
                offsets = {};
//at 是将元素放置容器的九个点（四个角+每条边的中心+矩形中心）
//my 基于上面九个点再定位
        dimensions = getDimensions(target);
        if (target[0].preventDefault) {
            // force left top to allow flipping
            options.at = "left top";
        }
        targetWidth = dimensions.width;
        targetHeight = dimensions.height;
        targetOffset = dimensions.offset;
        // clone to reuse original targetOffset later
        basePosition = avalon.mix({}, targetOffset);

        // force my and at to have valid horizontal and vertical positions
        // if a value is missing or invalid, it will be converted to center
        myAt.forEach(function(el) {
            var pos = (options[ el ] || "").split(" "),
                    horizontalOffset,
                    verticalOffset;

            if (pos.length === 1) {
                pos = rhorizontal.test(pos[ 0 ]) ?
                        pos.concat(["center"]) :
                        rvertical.test(pos[ 0 ]) ?
                        ["center"].concat(pos) :
                        ["center", "center"];
            }
            pos[ 0 ] = rhorizontal.test(pos[ 0 ]) ? pos[ 0 ] : "center";
            pos[ 1 ] = rvertical.test(pos[ 1 ]) ? pos[ 1 ] : "center";

            // calculate offsets
            horizontalOffset = roffset.exec(pos[ 0 ]);
            verticalOffset = roffset.exec(pos[ 1 ]);
            offsets[ el ] = [
                horizontalOffset ? horizontalOffset[ 0 ] : 0,
                verticalOffset ? verticalOffset[ 0 ] : 0
            ];

            // reduce to just the positions without the offsets
            options[ el ] = [
                rposition.exec(pos[ 0 ])[ 0 ],
                rposition.exec(pos[ 1 ])[ 0 ]
            ];
        });
        // normalize collision option
        if (collision.length === 1) {
            collision[ 1 ] = collision[ 0 ];
        }

        if (options.at[ 0 ] === "right") {
            basePosition.left += targetWidth;
        } else if (options.at[ 0 ] === "center") {
            basePosition.left += targetWidth / 2;
        }

        if (options.at[ 1 ] === "bottom") {
            basePosition.top += targetHeight;
        } else if (options.at[ 1 ] === "center") {
            basePosition.top += targetHeight / 2;
        }

        atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
        basePosition.left += atOffset[ 0 ];
        basePosition.top += atOffset[ 1 ];

        // return this.each(function() {
        var collisionPosition,
                elem = this[0],
                elemWidth = elem.offsetWidth,
                elemHeight = elem.offsetHeight,
                marginLeft = parseCss(this, "marginLeft"),
                marginTop = parseCss(this, "marginTop"),
                collisionWidth = elemWidth + marginLeft + parseCss(this, "marginRight") + scrollInfo.width,
                collisionHeight = elemHeight + marginTop + parseCss(this, "marginBottom") + scrollInfo.height,
                position = avalon.mix({}, basePosition),
                myOffset = getOffsets(offsets.my, elemWidth, elemHeight);

        if (options.my[ 0 ] === "right") {
            position.left -= elemWidth;
        } else if (options.my[ 0 ] === "center") {
            position.left -= elemWidth / 2;
        }

        if (options.my[ 1 ] === "bottom") {
            position.top -= elemHeight;
        } else if (options.my[ 1 ] === "center") {
            position.top -= elemHeight / 2;
        }

        position.left += myOffset[ 0 ];
        position.top += myOffset[ 1 ];

        // if the browser doesn't support fractions, then round for consistent results

        position.left = round(position.left);
        position.top = round(position.top);

        collisionPosition = {
            marginLeft: marginLeft,
            marginTop: marginTop
        };

        ["left", "top"].forEach(function(dir) {
            flip[ dir ](position, {
                targetWidth: targetWidth,
                targetHeight: targetHeight,
                elemWidth: elemWidth,
                elemHeight: elemHeight,
                collisionPosition: collisionPosition,
                collisionWidth: collisionWidth,
                collisionHeight: collisionHeight,
                offset: [atOffset[ 0 ] + myOffset[ 0 ], atOffset [ 1 ] + myOffset[ 1 ]],
                my: options.my,
                at: options.at,
                within: within,
                elem: elem
            });
        });
        return  this.offset(position);
    }
    var flip = {
        left: function(position, data) {
            var within = data.within,
                    withinOffset = within.offset.left + within.scrollLeft,
                    outerWidth = within.width,
                    offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
                    collisionPosLeft = position.left - data.collisionPosition.marginLeft,
                    overLeft = collisionPosLeft - offsetLeft,
                    overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
                    myOffset = data.my[ 0 ] === "left" ?
                    -data.elemWidth :
                    data.my[ 0 ] === "right" ?
                    data.elemWidth :
                    0,
                    atOffset = data.at[ 0 ] === "left" ?
                    data.targetWidth :
                    data.at[ 0 ] === "right" ?
                    -data.targetWidth :
                    0,
                    offset = -2 * data.offset[ 0 ],
                    newOverRight,
                    newOverLeft;

            if (overLeft < 0) {
                newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
                if (newOverRight < 0 || newOverRight < abs(overLeft)) {
                    position.left += myOffset + atOffset + offset;
                }
            }
            else if (overRight > 0) {
                newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
                if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
                    position.left += myOffset + atOffset + offset;
                }
            }
        },
        top: function(position, data) {
            var within = data.within,
                    withinOffset = within.offset.top + within.scrollTop,
                    outerHeight = within.height,
                    offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
                    collisionPosTop = position.top - data.collisionPosition.marginTop,
                    overTop = collisionPosTop - offsetTop,
                    overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
                    top = data.my[ 1 ] === "top",
                    myOffset = top ?
                    -data.elemHeight :
                    data.my[ 1 ] === "bottom" ?
                    data.elemHeight :
                    0,
                    atOffset = data.at[ 1 ] === "top" ?
                    data.targetHeight :
                    data.at[ 1 ] === "bottom" ?
                    -data.targetHeight :
                    0,
                    offset = -2 * data.offset[ 1 ],
                    newOverTop,
                    newOverBottom;
            if (overTop < 0) {
                newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
                if ((position.top + myOffset + atOffset + offset) > overTop && (newOverBottom < 0 || newOverBottom < abs(overTop))) {
                    position.top += myOffset + atOffset + offset;
                }
            }
            else if (overBottom > 0) {
                newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
                if ((position.top + myOffset + atOffset + offset) > overBottom && (newOverTop > 0 || abs(newOverTop) < overBottom)) {
                    position.top += myOffset + atOffset + offset;
                }
            }
        }
    }
    avalon.fn.position = function(options) {
        if (avalon.type(options) === "object") {
            return setPosition.call(this, options)
        }
        return  oldPosition.call(this)
    }

    //===========================学习express的做法，将私有函数放在底部================================
    function getDimensions(elem) {
        var raw = elem[0];
        if (raw.nodeType === 9) {
            return {
                width: elem.width(),
                height: elem.height(),
                offset: {top: 0, left: 0}
            };
        }
        if (avalon.isWindow(raw)) {
            return {
                width: elem.width(),
                height: elem.height(),
                offset: {top: elem.scrollTop(), left: elem.scrollLeft()}
            };
        }
        if (raw.preventDefault) {
            return {
                width: 0,
                height: 0,
                offset: {top: raw.pageY, left: raw.pageX}
            };
        }
        return {
            width: raw.offsetWidth,
            height: raw.offsetHeight,
            offset: elem.offset()
        };
    }

    function getOffsets(offsets, width, height) {
        return [
            parseFloat(offsets[ 0 ]) * (rpercent.test(offsets[ 0 ]) ? width / 100 : 1),
            parseFloat(offsets[ 1 ]) * (rpercent.test(offsets[ 1 ]) ? height / 100 : 1)
        ];
    }
    function parseCss(element, property) {
        return parseInt(element.css(property), 10) || 0;
    }
    function setOffset(options) {
        var elem = this[0]
        var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
                position = this.css("position")

        // Set position first, in-case top/left are set even on static elem
        if (position === "static") {
            elem.style.position = "relative";
        }

        curOffset = this.offset();
        curCSSTop = this.css("top");
        curCSSLeft = this.css("left");
        calculatePosition = (position === "absolute" || position === "fixed") &&
                (curCSSTop + curCSSLeft).indexOf("auto") > -1;
        // Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
        if (calculatePosition) {
            curPosition = this.position();
            curTop = curPosition.top;
            curLeft = curPosition.left;

        } else {
            curTop = parseFloat(curCSSTop) || 0;
            curLeft = parseFloat(curCSSLeft) || 0;
        }

        if (options.top != null) {
            elem.style.top = (options.top - curOffset.top) + curTop + "px"
        }
        if (options.left != null) {
            elem.style.left = (options.left - curOffset.left) + curLeft + "px"
        }

        return this
    }

    function scrollbarWidth() {//求出当前页面滚动条的宽，IE6-7好像固定是17px
        if (cachedScrollbarWidth !== void 0) {
            return cachedScrollbarWidth;
        }
        var w1, w2,
                div = avalon.parseHTML("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>").firstChild,
                innerDiv = div.children[0]
        document.body.appendChild(div)
        w1 = innerDiv.offsetWidth
        div.style.overflow = "scroll"
        w2 = innerDiv.offsetWidth
        if (w1 === w2) {
            w2 = div.clientWidth
        }
        document.body.removeChild(div)
        return (cachedScrollbarWidth = w1 - w2)
    }
    function getScrollInfo(within) {//within为getWithinInfo返回的对象
        var overflowX = within.isWindow ? "" : within.element.css("overflow-x"),
                overflowY = within.isWindow ? "" : within.element.css("overflow-y"),
                hasOverflowX = overflowX === "scroll" ||
                (overflowX === "auto" && within.width < within.element[0].scrollWidth),
                hasOverflowY = overflowY === "scroll" ||
                (overflowY === "auto" && within.height < within.element[0].scrollHeight);
        return {
            width: hasOverflowY ? scrollbarWidth() : 0,
            height: hasOverflowX ? scrollbarWidth() : 0
        };
    }
    function getWithinInfo(element) {//求得当前对象一切涉及尺寸的数值
        var withinElement = avalon(element || window),
                isWindow = avalon.isWindow(withinElement[0]);

        return {
            element: withinElement,
            isWindow: isWindow,
            offset: withinElement.offset() || {left: 0, top: 0},
            scrollLeft: withinElement.scrollLeft(),
            scrollTop: withinElement.scrollTop(),
            width: isWindow ? withinElement.width() : withinElement[0].offsetWidth,
            height: isWindow ? withinElement.height() : withinElement[0].offsetHeight
        };
    }

    return avalon
})