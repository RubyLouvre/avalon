
var canHideProperty = require('./canHideProperty')
var $$skipArray = require('./skipArray')


var defineProperties = Object.defineProperties
var defineProperty

var expose = new Date() - 0

if (!canHideProperty) {
    if ('__defineGetter__' in avalon) {
        defineProperty = function (obj, prop, desc) {
            if ('value' in desc) {
                obj[prop] = desc.value
            }
            if ('get' in desc) {
                obj.__defineGetter__(prop, desc.get)
            }
            if ('set' in desc) {
                obj.__defineSetter__(prop, desc.set)
            }
            return obj
        }
        defineProperties = function (obj, descs) {
            for (var prop in descs) {
                if (descs.hasOwnProperty(prop)) {
                    defineProperty(obj, prop, descs[prop])
                }
            }
            return obj
        }
    }
    if (avalon.msie) {
        var VBClassPool = {}
        window.execScript([// jshint ignore:line
            'Function parseVB(code)',
            '\tExecuteGlobal(code)',
            'End Function' //转换一段文本为VB代码
        ].join('\n'), 'VBScript');
        
        function VBMediator(instance, accessors, name, value) {// jshint ignore:line
            var accessor = accessors[name]
            if (arguments.length === 4) {
                accessor.set.call(instance, value)
            } else {
                return accessor.get.call(instance)
            }
        }
        defineProperties = function (name, accessors, properties) {
            // jshint ignore:line
            var buffer = []
            buffer.push(
                    '\r\n\tPrivate [__data__], [__proxy__]',
                    '\tPublic Default Function [__const__](d' + expose + ', p' + expose + ')',
                    '\t\tSet [__data__] = d' + expose + ': set [__proxy__] = p' + expose,
                    '\t\tSet [__const__] = Me', //链式调用
                    '\tEnd Function')
            //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
            var uniq = {
               __proxy__: true,
               __data__: true,
               __const__: true
            }

            //添加访问器属性 
            for (name in accessors) {
                uniq[name] = true
                buffer.push(
                        //由于不知对方会传入什么,因此set, let都用上
                        '\tPublic Property Let [' + name + '](val' + expose + ')', //setter
                        '\t\tCall [__proxy__](Me,[__data__], "' + name + '", val' + expose + ')',
                        '\tEnd Property',
                        '\tPublic Property Set [' + name + '](val' + expose + ')', //setter
                        '\t\tCall [__proxy__](Me,[__data__], "' + name + '", val' + expose + ')',
                        '\tEnd Property',
                        '\tPublic Property Get [' + name + ']', //getter
                        '\tOn Error Resume Next', //必须优先使用set语句,否则它会误将数组当字符串返回
                        '\t\tSet[' + name + '] = [__proxy__](Me,[__data__],"' + name + '")',
                        '\tIf Err.Number <> 0 Then',
                        '\t\t[' + name + '] = [__proxy__](Me,[__data__],"' + name + '")',
                        '\tEnd If',
                        '\tOn Error Goto 0',
                        '\tEnd Property')

            }
            for (name in properties) {
                if (uniq[name] !== true) {
                    uniq[name] = true
                    buffer.push('\tPublic [' + name + ']')
                }
            }
            for (name in $$skipArray) {
                if (uniq[name] !== true) {
                    uniq[name] = true
                    buffer.push('\tPublic [' + name + ']')
                }
            }
            buffer.push('\tPublic [' + 'hasOwnProperty' + ']')
            buffer.push('End Class')
            var body = buffer.join('\r\n')
            var className = VBClassPool[body]
            if (!className) {
                className = avalon.makeHashCode('VBClass')
                
                window.parseVB('Class ' + className + body)
                window.parseVB([
                    'Function ' + className + 'Factory(a, b)', //创建实例并传入两个关键的参数
                    '\tDim o',
                    '\tSet o = (New ' + className + ')(a, b)',
                    '\tSet ' + className + 'Factory = o',
                    'End Function'
                ].join('\r\n'))
                VBClassPool[body] = className
            }
            var ret = window[className + 'Factory'](accessors, VBMediator) //得到其产品
            return ret //得到其产品
        }
    }
}

module.exports = defineProperties
