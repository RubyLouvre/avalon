if (!Object.is) {

    function SameValue(a, b) {
        if (a === b) {
            // 0 === -0, but they are not identical.
            if (a === 0) {
                return 1 / a === 1 / b
            }
            return true
        }
        return numberIsNaN(a) && numberIsNaN(b)
    }

    var numberIsNaN = Number.isNaN || function isNaN(value) {
        // NaN !== NaN, but they are identical.
        // NaNs are the only non-reflexive value, i.e., if x !== x,
        // then x is NaN.
        // isNaN is broken: it converts its argument to number, so
        // isNaN('foo') => true
        return value !== value;
    }
    Object.is = SameValue
}