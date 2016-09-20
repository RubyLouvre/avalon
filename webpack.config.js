var webpack = require('webpack');

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
    普通vm也支持onReady, onDispose方法(生命周期)
    添加norequire验证规则
    强化UUID的生成策略
    fix replaceChild的重写BUG(用于onDispose方法)
    xmp, wbr, template可以直接使用is属性代替ms-widget属性,
       即<xmp :widget="{is:'ms-button'}"></xmp> -->
        <xmp is="ms-button"></xmp>
    简化attr指令的实现,其diff逻辑与css指令的diff一样,直接用css指令的
    一劳永逸解决IE6-8下VBS属性重复定义抛错的BUG
    新的 jsparser
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
        pager: "./src/pager"
        // 'avalon.mobile': './src/avalon.mobile'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'avalon'
    }, //页面引用的文件
    plugins: [
         cssExtractor,
        new webpack.BannerPlugin('built in ' + snow + ' version ' + v + ' by 司徒正美\n' + feather)
    ],
   module: {
        loaders: [
            //http://react-china.org/t/webpack-extracttextplugin-autoprefixer/1922/4
            // https://github.com/b82/webpack-basic-starter/blob/master/webpack.config.js 
            {test: /\.html$/, loader: 'raw!html-minify'},
            {test: /\.scss$/, loader: cssExtractor.extract( 'css!sass')}


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
    
    eslint: {
        configFile: './eslintrc.json'
    },
    resolve: {
        extensions: ['.js', '', '.css'],
        alias: {
            //处理  Module not found: Error: a dependency to an entry point is not allowed
            //当用户使用require('avalon2'), require('avalon')时,让它指向./dist目录,
            //不要指向node_modules/avalon2/dist目录
            avalon:  path.join(__dirname, './dist/avalon') ,
            avalon2: path.join(__dirname, './dist/avalon')
        }
    }
}
