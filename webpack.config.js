var webpack = require('webpack');

var path = require('path');
var fs = require('fs')
var json = require('./package.json')

var version =  '2.1.0'.split('.')    // json.version.split('.')
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
重大升级!!!!
 
重构虚拟DOM同步真实DOM的机制,现在是一边diff一边patch,一个遍历搞定!
(之前是diff新旧虚拟DOM树,然后再为真实DOM树刷新)
    
所有vm都支持onReady,在它第一次刷新作用区载时触发 
添加新的对齐节点算法
优化lexer虚拟DOM生成器
完全重写ms-for, ms-html指令
重构ms-if指令
修正on指令的UUID问题
修正__local__往下传递 问题
参考react 的classNames插件，重构ms-class/active/hover，
上线全新的parseHTML，内部基于avalon.lexer，能完美生成script, xml,svg元素
重构isInCache， saveInCache
修正e.which BUG
修正 ms-duplex-checked在低版本浏览器不断闪烁的问题

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
            {test: /\.jade$/, loader: 'text-loader'}

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
            avalon: './src/avalon',
            'vars': path.join(process.cwd(), './src/base/builtin')
        }
    }
}
