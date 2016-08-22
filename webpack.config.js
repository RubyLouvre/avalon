var webpack = require('webpack');

var path = require('path');
var fs = require('fs')
var json = require('./package.json')

var version = json.version.split('.')
var v = (version.shift() + '.' + version.join('')).replace(/0+$/, "0")
var text = fs.readFileSync('./src/seed/lang.share.js', 'utf8')
text = text.replace(/version\s*\:\s*([^,]+)/, function (a, b) {
    return 'version: ' + JSON.stringify(v)
})
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
var feather = heredoc(function () {
    /*
     2.1.5 and npm 2.1.15
    修正 ms-controller, ms-important的移除类名的实现
    实现后端渲染,
    fix safari, 微信不支持使用Object.defineProperty重写元素属性的BUG
    分离DOM API
    fix ms-on BUG 
     */
})
fs.writeFileSync('./src/seed/lang.share.js', text, 'utf8')
var now = new Date
var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours()
var a = __dirname.replace('avalon', 'koa2')
module.exports = {
    entry: {
        avalon: './src/avalon', //我们开发时的入口文件
        'avalon.modern': './src/avalon.modern',
        'avalon.test': './src/avalon.test',
        'avalon.next': './src/avalon.next',
        // 'avalon.mobile': './src/avalon.mobile'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'avalon'
    }, //页面引用的文件
    plugins: [//
        new webpack.BannerPlugin('built in ' + snow + ' version ' + v + ' by 司徒正美\n' + feather)
    ],
    module: {
    },
    eslint: {
        configFile: './eslintrc.json'
    },
    resolve: {
        extensions: ['.js', '', '.css'],
        alias: {
            avalon: './src/avalon'
        }
    }
}
