var webpack = require('webpack');

var path = require('path');
var fs = require('fs')
var json = require('./package.json')

var version = json.version.split('.')
var v = version.shift() + '.' + version.join('')
var text = fs.readFileSync('./src/seed/lang.share.js', 'utf8')
text = text.replace(/version\s*\:\s*([^,]+)/, function (a, b) {
    return 'version: ' + v
})

fs.writeFileSync('./src/seed/lang.share.js', text, 'utf8')

module.exports = {
    entry: {
        avalon: './src/avalon', //我们开发时的入口文件
        'avalon.modern': './src/avalon.modern'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'avalon'
    }, //页面引用的文件

    module: {
        loaders: [
            {test: /\.jade$/, loader: 'text-loader'}
        ]
    },
    resolve: {
        extensions: ['.js', '', '.css'],
        alias: {
            avalon: './src/avalon',
            'vars': path.join(process.cwd(), './src/base/builtin')
        }
    }
}
