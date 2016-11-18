import { rcheckedType } from '../rcheckedType'
export function getDuplexType(elem) {
    var ret = elem.tagName.toLowerCase()
    if (ret === 'input') {
        return rcheckedType.test(elem.type) ? 'checked' : elem.type
    }
    return ret
}
