var webpack = require('webpack');

var path = require('path');
var fs = require('fs')
var json = require('./package.json')

var version = json.version.split('.')
var v = (version.shift() + '.' + version.join('')).replace(/0+$/, "0")
var text = fs.readFileSync('./src/seed/core.js', 'utf8')
text = text.replace(/version\s*\:\s*([^,]+)/, function (a, b) {
    return 'version: ' + JSON.stringify(v)
})
function heredoc(fn) {
    return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
}
var feather = heredoc(function () {
    /*
    npm 2.1.14
    修正 ms-important的BUG
    重构 escapeHTML与unescapeHTML方法
    改用id来定义组件VM的$id
    修正pattern验证规则
    添加大量测试,覆盖率达到90%
    增强对SVG的支持
     */
})
fs.writeFileSync('./src/seed/core.js', text, 'utf8')
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
//    loaders: [
//        {
//            test: /\.js$/,
//            exclude: /node_modules/,
//            loader: 'babel',
//            query: {
//                presets: ['es2015','stage-0','stage-1','stage-2','stage-3']
//            }
//        }
//    ],
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
