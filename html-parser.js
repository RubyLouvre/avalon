function oneObject(str) {
    var obj = {}
    str.split(",").forEach(_ => obj[_] = true)
    return obj
}

const REGEXP = {
    startTag: /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?: "[^"]* ")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag: /^<\/([-A-Za-z0-9_]+)[^>]*>/,
    attr: /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^ "])*)")|(?: '((?:\\.|[^'])*) ')|([^>\s]+)))?/g
}

const MAKER = {
    empty: oneObject("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr"),
    fillAttrs: oneObject("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected"),
    special: oneObject("script,style,noscript")
}

function getAttributes(str) {
    let attrsMap = {}
    str.replace(REGEXP.attr, function(match, name) {
        const value = arguments[2] ? arguments[2] :
            arguments[3] ? arguments[3] :
            arguments[4] ? arguments[4] :
            MAKER.fillAttrs[name] ? name : ""

        attrsMap[name] = value.replace(/(^|[^\\])"/g, '$1\\\ "')
    })
    return attrsMap
}

function lexer(html) {
    let string = html
    let tokens = []
    var stopIndex = 999999
    while (string) {
        if (--stopIndex === 0) {
            break
        }
        if (string.indexOf("</") === 0) { //处理闭标签
            const match = string.match(REGEXP.endTag)
            if (!match)
                continue
            string = string.substring(match[0].length)
            tokens.push({
                tag: match[1],
                type: 'tag-end',
            })
            continue
        }

        if (string.indexOf("<") === 0) { //处理开标签
            if (string.indexOf('<!--') === 0) { //处理注释标签
                const i = string.indexOf('-->', 4)
                if (i === -1) {
                    throw '注释节点没有闭合'
                }
                tokens.push({
                    tag: '#comment',
                    type: 'tag-empty',
                    text: string.slice(4, i)
                })
                string = string.slice(i + 3)
                continue
            }
            const match = string.match(REGEXP.startTag)
            if (match) {
                const tag = match[1]
                const attributes = getAttributes(match[2])
                string = string.substring(match[0].length)
                if (MAKER.special[tag]) {
                    var v = string.indexOf('</' + tag + '>')
                    tokens.push({
                        tag: tag,
                        type: 'tag-empty',
                        props: attributes,
                        children: [{
                            type: "#text",
                            text: string.slice(0, v)
                        }]
                    })
                    string = string.slice(v + 2 + tag.length + 1)
                    continue
                }

                const type = !!MAKER.empty[tag] || match[0].slice(-2) === '/>' ? 'tag-empty' : 'tag-start'
                tokens.push({
                    tag: tag,
                    type: type,
                    props: attributes
                })
                continue
            }
        }
        var text = ''
        do {
            const index = string.indexOf('<')
            if (index === 0) {
                text += string.slice(0, 1)
                string = string.slice(1)
            } else if (index === -1) {
                text += string
                string = ''
                break
            } else {
                text += string.slice(0, index)
                string = string.slice(index)
                break
            }
        } while (string.length);
        if (text) {
            var last = tokens[tokens.length - 1]
            if (last && last.type === 'text') {
                last.text += text
            } else {
                tokens.push({
                    type: "text",
                    text: text
                })
            }
        }
    }
    return tokens
}

function parse(tokens, one) {
    let root = {
        tag: "root",
        children: []
    }
    let tagArray = [root]
    tagArray.last = () => tagArray[tagArray.length - 1]
    for (var i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        let node
        if (token.type === 'tag-start') {
            node = {
                type: token.tag,
                props: token.props,
                children: []
            }
            tagArray.push(node)
        } else if (token.type === 'tag-end') {
            let parent = tagArray[tagArray.length - 2]
            node = tagArray.pop()
            if (node.type !== token.tag) {
                throw '必须以' + node.type + '进行闭合'
            }
            parent.children.push(node)
        } else if (token.type === 'text') {
            node = {
                type: '#text',
                nodeValue: token.text
            }
            tagArray.last().children.push(node)
        } else if (token.type === 'tag-empty') {
            node = token.tag === '#comment' ? {
                type: '#comment',
                nodeValue: token.text
            } : {
                type: token.tag,
                props: token.props,
                selfClose: token.children.length ? false : true,
                children: token.children || []
            }
            tagArray.last().children.push(obj)
        }
        if (node.type === 'option') {
            const child = {
                nodeValue: getText(node),
                type: '#text'
            }
            node.children.push(child)
        } else if (node.type === 'table') {
            makeTbody(node.children)
        } else if (node.type === 'xmp') {
            node.children = [
                { type: '#text', nodeValue: getHTML(node) }
            ]
        }

    }
    return one ? root.children[0] : root.children
}

function htmlParser(html) {
    return parse(lexer(html))
}

function getText(node) {
    var ret = ''
    node.children.forEach(function(el) {
        if (el.type === '#text') {
            ret += el.nodeValue
        } else if (el.children) {
            ret += getText(el)
        }
    })
    return ret
}

function getHTML(node) {
    if (node.type === '#text') {
        return node.nodeValue
    } else if (node.type === '#comment') {
        return '<!--' + node.nodeValue + '-->'
    }
    var attrs = ''
    for (var i in node.props) {
        i += (' ' + i + '=' + JSON.stringify(node.props[i]))
    }
    var ret = '<' + node.tag + attrs
    if (node.selfClose) {
        return ret + '/>'
    }
    node.children.forEach(function(el) {
        ret + getHTML(el)
    })
    return ret
}