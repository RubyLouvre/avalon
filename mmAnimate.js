

avalon.init = function(el) {
    this[0] = this.element = el
    avalon.mix(this, {
        isSVG: /^\[object SVG\w*Element\]$/.test(el),
        isAnimating: false,
        //引用着元素的computedStyle对象
        computedStyle: null,
        /* Tween data is cached for each animation on the element so that data can be passed across calls --
         in particular, end values are used as subsequent start values in consecutive Velocity calls. */
        tweensContainer: null,
        /* The full root property values of each CSS hook being animated on this element are cached so that:
         1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
         2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
        rootPropertyValueCache: {},
        /* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
        transformCache: {}
    })

}


/* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
var rAFShim = (function() {
    var timeLast = 0;

    return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
        var timeCurrent = (new Date()).getTime(),
                timeDelta;

        /* Dynamically set delay on a per-tick basis to match 60fps. */
        /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
        timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
        timeLast = timeCurrent + timeDelta;

        return setTimeout(function() {
            callback(timeCurrent + timeDelta);
        }, timeDelta);
    };
})();




avalon.fn.animate = function(propertiesMap, options) {
    //=====================处理options参数==========================
    //将多余的参数合并到options对象上
    // animate(propertiesMap [, duration] [, easing] [, complete])
    if (propertiesMap !== "stop" && !avalon.isPlainObject(options)) {
        options = {}
        for (var i = 1; i < arguments.length; i++) {
            var option = arguments[i]
            if (!Array.isArray(option) && (/^(fast|normal|slow)$/i.test(option) || /^\d/.test(option))) {
                options.duration = option//动画时长
            } else if (typeof option === "string" || Array.isArray(option)) {
                options.easing = option //缓动公式
            } else if (avalon.isFunction(option)) {
                options.complete = option //动画完成时的回调函数
            }
        }
    }
    var promiseData = {
        promise: null,
        resolver: null,
        rejecter: null
    }
    var element = this[0]


    promiseData.promise = new Promise(function(resolve, reject) {
        promiseData.resolver = resolve
        promiseData.rejecter = reject
    })

//=====================处理propertiesMap参数==========================
    var action;

    switch (propertiesMap) {
        case "scroll":
            action = "scroll";
            break;

        case "reverse":
            action = "reverse";
            break;

        case "stop":
            /*******************
             Action: Stop
             *******************/
            var elemData = Data(element), delayTimer
            if (elemData && (delayTimer = elemData.delayTimer)) {
                clearTimeout(delayTimer.setTimeout);
                if (delayTimer.next) {
                    delayTimer.next();
                }

                delete elemData.delayTimer;
            }


            var callsToStop = [];

            Velocity.State.calls.forEach(function(activeCall, i) {
                /* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
                if (activeCall) {
                    /* Iterate through the active call's targeted elements. */
                    activeCall[1].forEach(function(activeElement, k) {
                        var queueName = typeof options == "string" ? options : "";

                        if (options !== undefined && activeCall[2].queue !== queueName) {
                            return true;
                        }

                        if (element === activeElement) {
                            if (options !== undefined) {
                                avalon.queue(element, queueName).forEach(function(item) {
                                    if (avalon.isFunction(item)) {
                                        item(null, true);
                                    }
                                })

                                avalon.queue(element, queueName, []);
                            }

                            if (elemData && queueName === "") {
                                //遍历tweensContainer这个对象
                                avalon.each(elemData.tweensContainer, function(m, activeTween) {
                                    activeTween.endValue = activeTween.currentValue;
                                });
                            }

                            callsToStop.push(i);
                        }
                    });
                }
            });

            /* Prematurely call completeCall() on each matched active call, passing an additional flag to indicate
             that the complete callback and display:none setting should be skipped since we're completing prematurely. */
            callsToStop.forEach(function(el) {
                completeCall(el, true);
            });
            if (promiseData.promise) {
                promiseData.resolver(element);
            }
            return promiseData.promise

        default:
            //如果第一个参数为一个朴素的JS对象,并且不为空对象
            if (avalon.isPlainObject(propertiesMap) && !Velocity.isEmptyObject(propertiesMap)) {
                action = "start";

                /****************
                 Redirects
                 ****************/

                /* Check if a string matches a registered redirect (see Redirects above). */
            } else if (typeof propertiesMap === "string" && Velocity.Redirects[propertiesMap]) {
                var opts = avalon.mix({}, options),
                        durationOriginal = opts.duration,
                        delayOriginal = opts.delay || 0;


                var elements = [element]
                var elementsLength = elements.length
                /* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
                avalon.each(elements, function(elementIndex, element) {
                    /* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
                    if (parseFloat(opts.stagger)) {
                        opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
                    } else if (avalon.isFunction(opts.stagger)) {
                        opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
                    }

                    /* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
                     the duration of each element's animation, using floors to prevent producing very short durations. */
                    if (opts.drag) {
                        /* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
                        opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : 400);

                        /* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
                         B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
                         The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
                        opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex / elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
                    }

                    /* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
                     reduce the opts checking logic required inside the redirect. */
                    Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
                });

                /* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
                 (The performance overhead up to this point is virtually non-existant.) */
                /* Note: The jQuery call chain is kept intact by returning the complete element set. */
                return promiseData.promise
            } else {
                var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

                if (promiseData.promise) {
                    promiseData.rejecter(new Error(abortError));
                } else {
                    avalon.log(abortError);
                }
                return promiseData.promise
            }
    }

    var callUnitConversionData = {
        lastParent: null,
        lastPosition: null,
        lastFontSize: null,
        lastPercentToPxWidth: null,
        lastPercentToPxHeight: null,
        lastEmToPx: null,
        remToPx: null,
        vwToPx: null,
        vhToPx: null
    };
    
      var call = [];
      (function (){
          
      })()
}

var Velocity = avalon.fn.animate
avalon.mix(Velocity, {
    State: {
        /*  如果是移动设备，将会打开mobileHA开关 */
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        /* 判定是否安卓系统 */
        isAndroid: /Android/i.test(navigator.userAgent),
        /* gingerbread（姜饼）是安卓系统的一个新的版本，版本号为2.3（ 2.3.3-2.3.7）。此时会关闭mobileHA开关*/
        isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
        isChrome: window.chrome,
        isFirefox: /Firefox/i.test(navigator.userAgent),
        /* Create a cached element for re-use when checking for CSS property prefixes. */
        prefixElement: document.createElement("div"),
        /* Cache every prefix match to avoid repeating lookups. */
        prefixMatches: {},
        /* Cache the anchor used for animating window scrolling. */
        scrollAnchor: null,
        /* Cache the property names associated with the scroll anchor. */
        scrollPropertyLeft: null,
        scrollPropertyTop: null,
        /* Keep track of whether our RAF tick is running. */
        isTicking: false,
        /* Container for every in-progress call to Velocity. */
        calls: []
    },
    defaults: {
        queue: "",
        duration: 400,
        easing: "swing",
        begin: undefined,
        complete: undefined,
        progress: undefined,
        display: undefined,
        visibility: undefined,
        loop: false,
        delay: false,
        mobileHA: true,
        /* Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
        _cacheValues: true
    },
    CSS: { /* Defined below. */},
    /* Container for the user's custom animation redirects that are referenced by name in place of a properties map object. */
    Redirects: { /* Manually registered by the user. */},
    Easings: { /* Defined below. */},
    isEmptyObject: function(variable) {
        for (var name in variable) {
            return false;
        }
        return true;
    }
})
//注册一些常用特效
/* slideUp, slideDown */
"Down,Up".replace(avalon.rword, function(direction) {
    Velocity.Redirects["slide" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
        var opts = avalon.mix({}, options),
                begin = opts.begin,
                complete = opts.complete,
                computedValues = {height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: ""},
        inlineValues = {};

        if (opts.display === undefined) {
            /* Show the element before slideDown begins and hide the element after slideUp completes. */
            /* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
            opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
        }

        opts.begin = function() {
            /* If the user passed in a begin callback, fire it now. */
            begin && begin.call(elements, elements);

            /* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
            for (var property in computedValues) {
                /* Cache all inline values, we reset to upon animation completion. */
                inlineValues[property] = element.style[property];

                /* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
                 use forcefeeding to start from computed values and animate down to 0. */
                var propertyValue = Velocity.CSS.getPropertyValue(element, property);
                computedValues[property] = (direction === "Down") ? [propertyValue, 0] : [0, propertyValue];
            }

            /* Force vertical overflow content to clip so that sliding works as expected. */
            inlineValues.overflow = element.style.overflow;
            element.style.overflow = "hidden";
        }

        opts.complete = function() {
            /* Reset element to its pre-slide inline values once its slide animation is complete. */
            for (var property in inlineValues) {
                element.style[property] = inlineValues[property];
            }

            /* If the user passed in a complete callback, fire it now. */
            complete && complete.call(elements, elements);
            promiseData && promiseData.resolver(elements);
        };

        avalon(this).animate(propertiesMap, opts);
    };
});

/* fadeIn, fadeOut */
"In,Out".replace(avalon.rword, function(direction) {
    Velocity.Redirects["fade" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
        var opts = avalon.mix({}, options),
                propertiesMap = {opacity: (direction === "In") ? 1 : 0},
        originalComplete = opts.complete;

        /* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
         callbacks by firing them only when the final element has been reached. */
        if (elementsIndex !== elementsSize - 1) {
            opts.complete = opts.begin = null;
        } else {
            opts.complete = function() {
                if (originalComplete) {
                    originalComplete.call(elements, elements);
                }

                promiseData && promiseData.resolver(elements);
            }
        }

        /* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
        /* Note: We allow users to pass in "null" to skip display setting altogether. */
        if (opts.display === undefined) {
            opts.display = (direction === "In" ? "auto" : "none");
        }
        avalon(this).animate(propertiesMap, opts);
    };
});

/************************************************************************
 *                 Data, data, queue, dequeue                            *
 ************************************************************************/
function Data(element) {
    var response = $.data(element, "velocity");
    return response === null ? void 0 : response;
}
Data.uuid = 1
var getDataID = !window.VBArray ? function(obj) { //IE9+,标准浏览器
    return obj.uniqueNumber || (obj.uniqueNumber = Data.uuid++);
} : function(obj) {
    if (obj.nodeType !== 1) { //如果是普通对象，文档对象，window对象
        return obj.uniqueNumber || (obj.uniqueNumber = Data.uuid++);
    } //注：旧式IE的XML元素不能通过el.xxx = yyy 设置自定义属性
    var uid = obj.getAttribute("uniqueNumber");
    if (!uid) {
        uid = Data.uuid++;
        obj.setAttribute("uniqueNumber", uid);
    }
    return +uid; //确保返回数字
}
//avalon.data基于JS对象的数据缓存系统，avalon.fn.data是基于DOM的数据缓存系统
var avalonData = {}
avalon.data = function(node, key, value) {
    var id = getDataID(node)
    if (arguments.length === 3) {//getter
        var store = id && avalonData[id];
        if (key === undefined) {
            return store;
        } else if (store) {
            if (key in store) {
                return store[key];
            }
        }
    } else { //setter
        store = avalonData[id] = avalonData[id] || {}
        store[key] = value;
        return value;
    }
};

avalon.queue = function(elem, type, data) {
    if (!elem) {
        return;
    }
    type = (type || "fx") + "queue";
    var q = avalon.data(elem, type);
    if (!data) {
        return q || [];
    }
    if (!q || Array.isArray(data)) {
        q = avalon.data(elem, type, data.concat());
    } else {
        q.push(data);
    }

    return q
};

avalon.dequeue = function(elem, type) {
    /* Custom: Embed element iteration. */
    type = type || "fx"
    var queue = avalon.queue(elem, type),
            fn = queue.shift();

    if (fn === "inprogress") {
        fn = queue.shift();
    }
    if (fn) {
        if (type === "fx") {
            queue.unshift("inprogress");
        }
        fn.call(elem, function() {
            avalon.dequeue(elem, type);
        });
    }
};

/*********************************************************************
 *                 缓动公式                              *
 **********************************************************************/

/* Step easing generator. */
function generateStep(steps) {
    return function(p) {
        return Math.round(p * steps) * (1 / steps);
    };
}

/* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
function generateBezier(mX1, mY1, mX2, mY2) {
    var NEWTON_ITERATIONS = 4,
            NEWTON_MIN_SLOPE = 0.001,
            SUBDIVISION_PRECISION = 0.0000001,
            SUBDIVISION_MAX_ITERATIONS = 10,
            kSplineTableSize = 11,
            kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
            float32ArraySupported = "Float32Array" in window;

    /* Must contain four arguments. */
    if (arguments.length !== 4) {
        return false;
    }

    /* Arguments must be numbers. */
    for (var i = 0; i < 4; ++i) {
        if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
            return false;
        }
    }

    /* X values must be in the [0, 1] range. */
    mX1 = Math.min(mX1, 1);
    mX2 = Math.min(mX2, 1);
    mX1 = Math.max(mX1, 0);
    mX2 = Math.max(mX2, 0);

    var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

    function A(aA1, aA2) {
        return 1.0 - 3.0 * aA2 + 3.0 * aA1;
    }
    function B(aA1, aA2) {
        return 3.0 * aA2 - 6.0 * aA1;
    }
    function C(aA1) {
        return 3.0 * aA1;
    }

    function calcBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    }

    function getSlope(aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }

    function newtonRaphsonIterate(aX, aGuessT) {
        for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);

            if (currentSlope === 0.0)
                return aGuessT;

            var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }

        return aGuessT;
    }

    function calcSampleValues() {
        for (var i = 0; i < kSplineTableSize; ++i) {
            mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
    }

    function binarySubdivide(aX, aA, aB) {
        var currentX, currentT, i = 0;

        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            }
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

        return currentT;
    }

    function getTForX(aX) {
        var intervalStart = 0.0,
                currentSample = 1,
                lastSample = kSplineTableSize - 1;

        for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
        }

        --currentSample;

        var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]),
                guessForT = intervalStart + dist * kSampleStepSize,
                initialSlope = getSlope(guessForT, mX1, mX2);

        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT);
        } else if (initialSlope == 0.0) {
            return guessForT;
        } else {
            return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
        }
    }

    var _precomputed = false;

    function precompute() {
        _precomputed = true;
        if (mX1 != mY1 || mX2 != mY2)
            calcSampleValues();
    }

    var f = function(aX) {
        if (!_precomputed)
            precompute();
        if (mX1 === mY1 && mX2 === mY2)
            return aX;
        if (aX === 0)
            return 0;
        if (aX === 1)
            return 1;

        return calcBezier(getTForX(aX), mY1, mY2);
    };

    f.getControlPoints = function() {
        return [{x: mX1, y: mY1}, {x: mX2, y: mY2}];
    };

    var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
    f.toString = function() {
        return str;
    };

    return f;
}

/* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
/* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
 then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
var generateSpringRK4 = (function() {
    function springAccelerationForState(state) {
        return (-state.tension * state.x) - (state.friction * state.v);
    }

    function springEvaluateStateWithDerivative(initialState, dt, derivative) {
        var state = {
            x: initialState.x + derivative.dx * dt,
            v: initialState.v + derivative.dv * dt,
            tension: initialState.tension,
            friction: initialState.friction
        };

        return {dx: state.v, dv: springAccelerationForState(state)};
    }

    function springIntegrateState(state, dt) {
        var a = {
            dx: state.v,
            dv: springAccelerationForState(state)
        },
        b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
                c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
                d = springEvaluateStateWithDerivative(state, dt, c),
                dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
                dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

        state.x = state.x + dxdt * dt;
        state.v = state.v + dvdt * dt;

        return state;
    }

    return function springRK4Factory(tension, friction, duration) {

        var initState = {
            x: -1,
            v: 0,
            tension: null,
            friction: null
        },
        path = [0],
                time_lapsed = 0,
                tolerance = 1 / 10000,
                DT = 16 / 1000,
                have_duration, dt, last_state;

        tension = parseFloat(tension) || 500;
        friction = parseFloat(friction) || 20;
        duration = duration || null;

        initState.tension = tension;
        initState.friction = friction;

        have_duration = duration !== null;

        /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
        if (have_duration) {
            /* Run the simulation without a duration. */
            time_lapsed = springRK4Factory(tension, friction);
            /* Compute the adjusted time delta. */
            dt = time_lapsed / duration * DT;
        } else {
            dt = DT;
        }

        while (true) {
            /* Next/step function .*/
            last_state = springIntegrateState(last_state || initState, dt);
            /* Store the position. */
            path.push(1 + last_state.x);
            time_lapsed += 16;
            /* If the change threshold is reached, break. */
            if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
                break;
            }
        }

        /* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
         computed path and returns a snapshot of the position according to a given percentComplete. */
        return !have_duration ? time_lapsed : function(percentComplete) {
            return path[ (percentComplete * (path.length - 1)) | 0 ];
        };
    };
}());

/* jQuery easings. */
mmAnimate.Easings = {
    linear: function(p) {
        return p;
    },
    swing: function(p) {
        return 0.5 - Math.cos(p * Math.PI) / 2
    },
    /* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
    spring: function(p) {
        return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6));
    }
};

/* CSS3 and Robert Penner easings. */
avalon.each(
        [
            ["ease", [0.25, 0.1, 0.25, 1.0]],
            ["ease-in", [0.42, 0.0, 1.00, 1.0]],
            ["ease-out", [0.00, 0.0, 0.58, 1.0]],
            ["ease-in-out", [0.42, 0.0, 0.58, 1.0]],
            ["easeInSine", [0.47, 0, 0.745, 0.715]],
            ["easeOutSine", [0.39, 0.575, 0.565, 1]],
            ["easeInOutSine", [0.445, 0.05, 0.55, 0.95]],
            ["easeInQuad", [0.55, 0.085, 0.68, 0.53]],
            ["easeOutQuad", [0.25, 0.46, 0.45, 0.94]],
            ["easeInOutQuad", [0.455, 0.03, 0.515, 0.955]],
            ["easeInCubic", [0.55, 0.055, 0.675, 0.19]],
            ["easeOutCubic", [0.215, 0.61, 0.355, 1]],
            ["easeInOutCubic", [0.645, 0.045, 0.355, 1]],
            ["easeInQuart", [0.895, 0.03, 0.685, 0.22]],
            ["easeOutQuart", [0.165, 0.84, 0.44, 1]],
            ["easeInOutQuart", [0.77, 0, 0.175, 1]],
            ["easeInQuint", [0.755, 0.05, 0.855, 0.06]],
            ["easeOutQuint", [0.23, 1, 0.32, 1]],
            ["easeInOutQuint", [0.86, 0, 0.07, 1]],
            ["easeInExpo", [0.95, 0.05, 0.795, 0.035]],
            ["easeOutExpo", [0.19, 1, 0.22, 1]],
            ["easeInOutExpo", [1, 0, 0, 1]],
            ["easeInCirc", [0.6, 0.04, 0.98, 0.335]],
            ["easeOutCirc", [0.075, 0.82, 0.165, 1]],
            ["easeInOutCirc", [0.785, 0.135, 0.15, 0.86]]
        ], function(i, easingArray) {
    Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
});

/* Determine the appropriate easing type given an easing input. */
function getEasing(value, duration) {
    var easing = value;

    /* The easing option can either be a string that references a pre-registered easing,
     or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
    if (typeof value === "string") {
        /* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
        if (!Velocity.Easings[value]) {
            easing = false;
        }
    } else if (Array.isArray(value) && value.length === 1) {
        easing = generateStep.apply(null, value);
    } else if (Array.isArray(value) && value.length === 2) {
        /* springRK4 must be passed the animation's duration. */
        /* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
         function generated with default tension and friction values. */
        easing = generateSpringRK4.apply(null, value.concat([duration]));
    } else if (Array.isArray(value) && value.length === 4) {
        /* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
        easing = generateBezier.apply(null, value);
    } else {
        easing = false;
    }

    /* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
     if the Velocity-wide default has been incorrectly modified. */
    if (easing === false) {
        if (Velocity.Easings[Velocity.defaults.easing]) {
            easing = Velocity.defaults.easing;
        } else {
            easing = "swing";
        }
    }

    return easing;
}