require.config({
    baseUrl: "./kkk/loader",
    map: {
        "old/aaa": {
            ddd: "ddd1.0"
        },
        "new/aaa": {
            ddd: "ddd1.2"
        },
        "*": {
            ddd: "ddd1.1"
        }
    }
})

require(["old/aaa", "new/aaa", "eee"], function(a, b, c) {
    console.log(a, b, c)
})
