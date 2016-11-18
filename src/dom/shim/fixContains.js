 /* istanbul ignore next */
export function fixContains(root, el) {
    try { //IE6-8,游离于DOM树外的文本节点，访问parentNode有时会抛错
        while ((el = el.parentNode)){
            if (el === root)
                return true
        }
    } catch (e) {
    }
    return false
}