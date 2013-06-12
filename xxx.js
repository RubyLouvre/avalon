var old = [0, 1, 2, 4, 5, 6, 7, 8], neo = mess(old.concat())
var n = neo.length;

function mess(arr) {
    var _floor = Math.floor, _random = Math.random,
            len = arr.length, i, j, arri,
            n = _floor(len / 2) + 1;
    while (n--) {
        i = _floor(_random() * len);
        j = _floor(_random() * len);
        if (i !== j) {
            arri = arr[i];
            arr[i] = arr[j];
            arr[j] = arri;
        }
    }
    return arr;
}
console.log("old " + old);
console.log("neo " + neo)
for (var i = 0; i < n; i++) {
    var a = old[i], b = neo[i];
    if (a !== b) {
        old.splice(i, 1);
        old.push(a);//120
        console.log(old);
        i = i - 1
    }

}
console.log("---" + old + "----")