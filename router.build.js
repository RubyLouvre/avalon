var webpack = require('webpack')
var path = require('path')
//sudo npm install raw-loader html-minify-loader webpack
// npm install grunt@~0.4.0
module.exports = {
    entry: {
        main: './components/router/main',
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    }, //页面引用的文件
    module: {
        loaders: [
            //http://react-china.org/t/webpack-extracttextplugin-autoprefixer/1922/4
            // https://github.com/b82/webpack-basic-starter/blob/master/webpack.config.js 
            {test: /\.html$/, loader: 'raw'},
        ]
    },
    resolve: {
        extensions: ['.js', '','html']
    }
}

