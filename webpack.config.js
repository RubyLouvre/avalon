var webpack = require('webpack');
var StringReplacePlugin = require("string-replace-webpack-plugin");

var path = require('path');
var fs = require('fs')
var json = require('./package.json')
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var cssExtractor = new ExtractTextPlugin('/[name].css');
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
    npm 2.1.15
    fix parseExpr BUG #1768 与 #1765
    优化ms-effect指令,与ms-css指令共同相同的diff
    data-duplex-changed回调支持更多参数
    处理$watch监听复杂数BUG #1762
    处理date过滤器不解析 BUG
    重构ms-important后面的指令不执行的BUG
    改成es6 modules组织依赖,rollup.js打包
     */
})
fs.writeFileSync('./src/seed/core.js', text, 'utf8')
var now = new Date
var snow = now.getFullYear() + '-' + (now.getMonth() + 1) +
        '-' + now.getDate() + ':' + now.getHours()
module.exports = {
    entry: {
     //   avalon: './src/avalon', //我们开发时的入口文件
       // 'avalon': './dist/avalon.r',
       // 'avalon.modern': './dist/avalon.r.modern',
        'avalon.test': './src/avalon.test',
        'avalon.next': './src/avalon.next'
      //  pager: "./src/pager",
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: '[name]'
    }, //页面引用的文件
    plugins: [
          new StringReplacePlugin(),
         cssExtractor,
        new webpack.BannerPlugin('built in ' + snow + ' version ' + v + ' by 司徒正美\n' + feather)
    ],
   module: {
        loaders: [
            //http://react-china.org/t/webpack-extracttextplugin-autoprefixer/1922/4
            // https://github.com/b82/webpack-basic-starter/blob/master/webpack.config.js 
            {test: /\.html$/, loader: 'raw!html-minify'},
            {test: /\.scss$/, loader: cssExtractor.extract( 'css!sass')},
            {test: /\.css$/, loader: cssExtractor.extract( 'css')},
            { 
            test: /\.js$/,
            loader: StringReplacePlugin.replace({
                replacements: [
                    {
                        pattern: /'use strict';/,
                        replacement: function () {
                            return '';
                        }
                    },
                     {
                        pattern: /\|\|\s+undefined/g,
                        replacement: function () {
                            return '|| this'
                        }
                    },
                     {
                        pattern: /window\$1/g,
                        replacement: function () {
                            return 'window'
                        }
                    }
                ]})
            }

        ]
    },
    'html-minify-loader': {
        empty: true, // KEEP empty attributes
        cdata: true, // KEEP CDATA from scripts
        comments: true, // KEEP comments
        dom: {// options of !(htmlparser2)[https://github.com/fb55/htmlparser2]
            lowerCaseAttributeNames: false, // do not call .toLowerCase for each attribute name (Angular2 use camelCase attributes)
        }
    },
    externals: {
        "avalon2": 'avalon'
    },
    eslint: {
        configFile: './eslintrc.json'
    },
    resolve: {
        extensions: ['.js', '', '.css'],
        alias: {
            //处理  Module not found: Error: a dependency to an entry point is not allowed
            //当用户使用require('avalon2'), require('avalon')时,让它指向./dist目录,
            //不要指向node_modules/avalon2/dist目录
           // avalon:  path.join(__dirname, './dist/avalon') ,
           // avalon2: path.join(__dirname, './dist/avalon')
        }
    }
}
