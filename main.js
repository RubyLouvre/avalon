require.config({
    baseUrl: "./kkk",
    paths: {
        jquery: 'jQuery/jquery'
    }
})

require(["./aaa", "./bbb", "./ccc", "jquery"], function(a, b, c, d) {
    console.log([a, b, c, d] + " complete")
})