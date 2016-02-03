var webpack = require("webpack");

var path = require("path");

module.exports = {
    entry: {
        avalon: './src/avalon', //我们开发时的入口文件
        "avalon.modern": './src/avalon.modern'
    },
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        library: "avalon"
    }, //页面引用的文件

    module: {
    },
    resolve: {
        extensions: ['.js', "", ".css"],
        alias: {
            avalon: "./src/avalon",
            "vars": path.join(process.cwd(), "./src/base/builtin")
        }
    }
}
