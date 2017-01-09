
const nodes = {};
//回收元素节点
export function collectNode(node) {
	removeNode(node);

	if (node instanceof Element) {

		let name = node.normalizedNodeName || toLowerCase(node.nodeName).toLowerCase();
		(nodes[name] || (nodes[name] = [])).push(node);
	}
}

//只重复利用元素节点
export function createNode(nodeName, isSvg) {
	let name = nodeName.toLowerCase(),
		node = nodes[name] && nodes[name].pop() || 
                (isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : 
                document.createElement(nodeName));
	node.normalizedNodeName = name;
	return node;
}