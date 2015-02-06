require.config({
    baseUrl: "./kkk",
    paths: {
        jquery: 'jQuery/jquery'
    }
})

require(["./aaa", "./bbb", "./ccc", "jquery","css!style", "css!style2.css"], function(a, b, c, d) {
    console.log([a, b, c, d] + " complete")
})