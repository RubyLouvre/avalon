//如果直接将tr元素写table下面,那么浏览器将将它们(相邻的那几个),放到一个动态创建的tbody底下
export function makeTbody(nodes) {
    var tbody, needAddTbody = false,
        count = 0,
        start = 0,
        n = nodes.length
    for (var i = 0; i < n; i++) {
        var node = nodes[i]
        if (!tbody) {
            if (node.nodeName === 'tr') {
                //收集tr及tr两旁的注释节点
                tbody = {
                    nodeName: 'tbody',
                    props: {},
                    children: []
                }
                tbody.children.push(node)
                needAddTbody = true
                if (start === 0)
                    start = i
                nodes[i] = tbody
            }
        } else {
            if (node.nodeName !== 'tr' && node.children) {
                tbody = false
            } else {
                tbody.children.push(node)
                count++
                nodes[i] = 0
            }
        }
    }

    if (needAddTbody) {
        for (i = start; i < n; i++) {
            if (nodes[i] === 0) {
                nodes.splice(i, 1)
                i--
                count--
                if (count === 0) {
                    break
                }
            }
        }
    }
}