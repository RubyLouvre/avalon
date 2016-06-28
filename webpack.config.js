var webpack = require('webpack');

var path = require('path');
var fs = require('fs')
var json = require('./package.json')

var version =  json.version.split('.')
var v = (version.shift() + '.' + version.join('')).replace(/0+$/,"0")
var text = fs.readFileSync('./src/seed/lang.share.js', 'utf8')
text = text.replace(/version\s*\:\s*([^,]+)/, function (a, b) {
    return 'version: ' +JSON.stringify( v )
})
function heredoc(fn) {
                return fn.toString().replace(/^[^\/]+\/\*!?\s?/, '').
                     replace(/\*\/[^\/]+$/, '').trim().replace(/>\s*</g, '><')
            }
var feather = heredoc(function(){
    /*
修正isSkip方法,阻止regexp, window, date被转换成子VM
checkbox改用click事件来同步VM #1532
ms-duplex-string在radio 的更新失效问题
ms-for+expr在option元素不显示的问题（实质是节点对齐问题）
模板中的&copy;&times;没有被htmlDecode的问题
绑定在组件模板中最外层元素上的事件不生效
ie7,8下 ms-duplex 因为onproppertychange环调用，导致辞爆栈的问题
     */
})
fs.writeFileSync('./src/seed/lang.share.js', text, 'utf8')
var now = new Date
var snow = now.getFullYear()+'-'+ (now.getMonth()+1) +
        '-'+ now.getDate()+':'+ now.getHours()
module.exports = {
    entry: {
        avalon: './src/avalon', //我们开发时的入口文件
        'avalon.modern': './src/avalon.modern',
        'avalon.test': './src/avalon.test',
        'avalon.next': './src/avalon.next'
      //  'avalon.pager': './src/pager'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'avalon'
    }, //页面引用的文件
    plugins: [
      new webpack.BannerPlugin('built in '+snow+' version '+ v+' by 司徒正美\n'+feather)
    ],
    module: {
        loaders: [
        ],
        preLoaders: [
            //https://segmentfault.com/a/1190000004468428
          //  {test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules|__test__/}
        ]
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
