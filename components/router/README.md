avalon2+mmRouter示例

基于2.2.1

main.js是入口文件,会被打包成 dist目录下的main.js

main.js构建了一个简单的mmState,大家通过addState方法不断添加子页面

heredoc用了一些黑魔法,请不要对它进行压缩

build脚本位于这里 

https://github.com/RubyLouvre/avalon/blob/master/karma.conf.js

需要另外npm install raw-loader webpack grunt
