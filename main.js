require.config({
    baseUrl: "./kkk",
    paths: {
        jquery: 'jQuery/jquery'
    }
})

require(["./aaa", "./bbb", "./ccc", "text!xxx.htm","css!style"], function(a, b, c, d) {
    console.log([a, b, c, d] + " complete")
})