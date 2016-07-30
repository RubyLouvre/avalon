/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var userAgent = navigator.userAgent,
        isWebKit = userAgent.indexOf('WebKit') !== -1,
        isFirefox = userAgent.indexOf('Firefox') !== -1,
        isTrident = userAgent.indexOf('Trident') !== -1;

var helperDiv = document.createElement('div'),
        supportsTextContent = 'textContent' in document
function createMap() {
    return Object.create(null)
}
function getAttributes(node) {
    var attrs = node.attributes, ret = createMap()
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i]
        if (attr.specified) {
            ret[attr.name] = attr.value
        }
    }
    if (/input|textarea|select/i.test(node.nodeName)) {
        ret.type = node.type
    }
    var style = node.style.cssText
    if (style) {
        ret.style = style
    }
    var className = node.className
    if (className){
        ret['class'] = className
    }
    if (ret.type === 'select-one') {
        ret.selectedIndex = node.selectedIndex
    }
    return ret
}


function renderFormDOM(node) {
    switch (node.nodeType) {
        case 1:

            var ret = {
                nodeName: node.nodeName.toLowerCase(),
                nodeType: 1,
                props: getAttributes(node),
                dom: node,
                children: renderFormDOMs(node.childNodes, node)
            }
            if ('selectedIndex' in ret) {
                node.selectedIndex = ret.selectedIndex
            }
            return ret
        case 3:
            return {
                nodeName: '#text',
                nodeType: 3,
                children: node.nodeValue,
                dom: node
            }
        case 8:
            return {
                nodeName: '#text',
                nodeType: 3,
                children: node.nodeValue,
                dom: node
            }
    }
}
//根据 outerHTML 创建 虚拟DOM
function render(node) {
    return renderFormDOMs([node], null)
}
function renderFormDOMs(nodes, parent) {
    var arr = []
    nodes = avalon.slice(nodes)
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        switch (node.nodeType) {
            case 1:
                var value = node.getAttribute('ms-for')
                if (value) {
                    var start = {
                        nodeType: 8,
                        nodeName: '#comment',
                        signature: Math.random(),
                        nodeValue: 'ms-for:' + value,
                        dom: document.createComment('ms-for:' + value)
                    }

                    node.removeAttribute('ms-for')
                    start.template = createNodeHTML(renderFormDOM(node))
                    var end = {
                        nodeType: 8,
                        nodeName: '#comment',
                        signature: start.signature,
                        nodeValue: 'ms-for-end:',
                        dom: document.createComment('ms-for-end:')
                    }
                    arr.push(start, [], end)
                    if (parent) {
                        parent.replaceChild(end.dom, node)
                        parent.insertBefore(start.dom, end.dom)
                    }

                } else {
                    console.log(node)
                    arr.push(renderFormDOM(node))
                }
                break
            case 3:
                if (/\S/.test(node.nodeValue)) {
                    arr.push(renderFormDOM(node))
                } else {
                    remove(node)
                }
                break
            case 8:
                if (node.nodeValue.indexOf('ms-for:')) {
                    var start = renderFormDOM(node)
                    start.signature = Math.random()
                    var newArr = []
                    arr.push(newArr)
                    newArr.arr = arr
                    newArr.start = start
                    arr.push(start)
                    newArr = arr

                } else if (node.nodeValue.indexOf('ms-for-end:')) {
                    var start = arr.start
                    var old = arr
                    arr = arr.arr
                    var end = renderFormDOM(node)
                    end.signature = start.signature
                    start.template = createNodeHTML(old)
                    for (var j = 0; j < old.length; j++) {
                        remove(old[j])
                    }

                } else {
                    arr.push(renderFormDOM(node))
                }
        }
    }
    return arr
}

var f = document.createDocumentFragment()
function remove(node) {
    var dom = node.dom || node
    if (dom) {
        node.dom = null
        f.appendChild(dom)
        f.removeChild(dom)
    }
}


function escapeContent(value) {
    value = '' + value;
    if (isWebKit) {
        helperDiv.innerText = value;
        value = helperDiv.innerHTML;
    } else if (isFirefox) {
        value = value.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
    } else {
        value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return value;
}


function escapedAttr(name, value) {
    var type = typeof value;
    value = '' + value;
    if (type !== 'number') {
        if (isFirefox) {
            value = value.split('&').join('&amp;').split('"').join('&quot;');
        } else {
            value = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        }
    }
    // TODO validate attribute name
    return name + '="' + value + '"';
}

function createNodeHTML(node, context) {
    var children = node.children;
    switch (node.nodeType) {
        case 3:
            return escapeContent(children)
        case 8:
            return '<!--' + children + '-->';

        default:
            var html = ''
            var tag = node.nodeName
            if (tag) {
                var attrs = node.props;
                if (tag === 'select' && attrs) {
                    context = {selectedIndex: attrs.selectedIndex,
                        value: attrs.value,
                        optionIndex: 0};
                } else if (tag === 'option' && context) {
                    if ((context.value && context.value === attrs.value) ||
                            (context.selectedIndex !== undefined
                                    && context.selectedIndex === context.optionIndex)) {
                        attrs.selected = true;
                    }
                    context.optionIndex++;
                }
                // TODO validate tag name
                html = '<' + tag;
                if (attrs) {
                    html += ' ';
                    for (var attrName in attrs) {
                        var attrValue = attrs[attrName];
                        if (attrValue === false ||
                                (tag === 'select' && (attrName === 'value' || attrName === 'selectedIndex'))) {
                            continue;
                        } else if (tag === 'textarea' && attrName === 'value') {
                            children = attrValue;
                            continue;
                        } else if (attrValue === true) {
                            attrValue = '';
                        } else if (attrName === 'style' && typeof (attrValue) !== 'string') {
                            var style = '';
                            for (var propName in attrValue) {
                                style += propName + ': ' + attrValue[propName] + '; ';
                            }
                            attrValue = style;
                        }
                        html += ' ' + escapedAttr(attrName, attrValue);
                    }
                }
                html += '>'
            }
            if (typeof children === 'string') {
                html += escapeContent(children)
            }
            if (Array.isArray) {
                for (var i = 0, childrenLength = children.length; i < childrenLength; i++) {
                    html += createNodeHTML(children[i], context);
                }
            }
            if (tag) {
                html += node.isVoidTag ? '/> ' : '</' + tag + '>'
            }
            return html;
    }
}

function parseNodes(source, inner) {
    //ms-important， ms-controller ， ms-for 不可复制，省得死循环
    //ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = inner ? [] : ['\nvar vnodes = [];']

    for (var i = 0, el; el = source[i++]; ) {
        var vnode = parseNode(el)
        if (el.$prepend) {
            buffer.push(el.$prepend)
        }
        var append = el.$append
        delete el.$append
        delete el.$prepend
        if (vnode) {
            buffer.push(vnode + '\n')
        }
        if (append) {
            buffer.push(append)
        }
    }
    if (!inner) {
        buffer.push('return vnodes\n')
    }
    return buffer.join('\n')
}


function parseNodes(source, inner) {
    //ms-important， ms-controller ， ms-for 不可复制，省得死循环
    //ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = inner ? [] : ['\nvar vnodes = [];']

    for (var i = 0, el; el = source[i++]; ) {
        var vnode = parseNode(el)
        if (el.$prepend) {
            buffer.push(el.$prepend)
        }
        var append = el.$append
        delete el.$append
        delete el.$prepend
        if (vnode) {
            buffer.push(vnode + '\n')
        }
        if (append) {
            buffer.push(append)
        }
    }
    if (!inner) {
        buffer.push('return vnodes\n')
    }
    return buffer.join('\n')
}



function parseNode(vdom) {
    switch (vdom.nodeType) {
        case 3:
            if (config.rexpr.test(vdom.nodeValue) ) {
                return add(parseText(vdom))
            } else {
                return add(createCachedNode(vdom))
            }
        case 1:

            if (vdom.skipContent && vdom.skipAttrs) {
                return add(createCachedNode(vdom))
            }
            var copy = {
                props: {},
                type: vdom.type,
                nodeType: 1
            }
            var bindings = extractBindings(copy, vdom.props)
            bindings.map(function (b) {
                //将ms-*的值变成函数,并赋给copy.props[ms-*]
                //如果涉及到修改结构,则在source添加$append,$prepend
                avalon.directives[b.type].parse(copy, vdom, b)
                copy.dynamic = true
            }).join(',')
          
            if (vdom.isVoidTag) {
                copy.isVoidTag = true
            } else {
                if (!('children' in copy)) {
                    var c = vdom.children
                    if (c.length) {
                        copy.children = '(function(){' + parseNodes(c) + '})()'
                    } else {
                        copy.children = '[]'
                    }
                }
            }
            if (vdom.template)
                copy.template = vdom.template
            
            if (vdom.dynamic) {
                copy.dynamic = true
            }
            return addTag(copy)
        case 8:
            var nodeValue = vdom.nodeValue
            if (vdom.dynamic === 'for') {// 处理ms-for指令
                if (nodeValue.indexOf('ms-for:') !== 0) {
                    avalon.error('ms-for指令前不能有空格')
                }
               
                var copy = {
                    dynamic: 'for',
                    vmodel: '__vmodel__'
                }
                for (var i in vdom) {
                    if (vdom.hasOwnProperty(i) && !skips[i]) {
                        copy[i] = vdom[i]
                    }
                }

                avalon.directives['for'].parse(copy, vdom, vdom)
                vdom.$append += parseNodes(avalon.speedUp(avalon.lexer(vdom.template)),true)
                return addTag(copy) 
            } else if (nodeValue === 'ms-for-end:') {
              
                vdom.$append = addTag({
                    nodeType: 8,
                    type: '#comment',
                    nodeValue: vdom.signature,
                    key: 'traceKey'
                }) + '\n},__local__,vnodes)\n' +
                        addTag({
                            nodeType: 8,
                            type: "#comment",
                            signature: vdom.signature,
                            nodeValue: "ms-for-end:"
                        }) + '\n'
                return ''

            } else if (nodeValue.indexOf('ms-js:') === 0) {//插入JS声明语句
                var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
                var ret = addTag(vdom)
                var match = statement.match(rstatement)
                if (match && match[1]) {
                    vdom.$append = (vdom.$append || '') + statement +
                            "\n__local__." + match[1] + ' = ' + match[1] + '\n'
                } else {
                    avalon.warn(nodeValue + ' parse fail!')
                }
                return ret
            } else if(vdom.dynamic){
                return addTag(vdom)
            }else{
                return add(createCachedNode(vdom))
            }
   //     default:
//            if (Array.isArray(vdom)) {
//                console.log(vdom)
//                vdom.$append = parseNodes(vdom, true)
//            }
    }

}


module.exports = render