//只有遇到第一个直接放在table下的tr元素，才会插入新tbody，并收集接下来的其他非tbody, thead, tfoot元素

var rtbody = /^(tbody|thead|tfoot)$/
export function makeTbody(nodes) {
    var tbody = false
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        if (rtbody.test(node.nodeName)) {
            tbody = false
            continue
        }
        if (node.nodeName === 'tr') {
            if (tbody) {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            } else {
                tbody = {
                    nodeName: 'tbody',
                    props: {},
                    children: [node]
                }
                nodes.splice(i, 1, tbody)
            }
        } else {
            if (tbody) {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
        }
    }
}