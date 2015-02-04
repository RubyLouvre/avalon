require.config({
    baseUrl: "./kkk",
    paths: {
        jquery: 'jQuery/jquery'
    }
})

require(["./aaa", "./bbb", "./ccc"], function(a) {
    console.log(a + " complete")
})