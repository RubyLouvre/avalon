var rollup = require("rollup").rollup
var commonjs = require("rollup-plugin-commonjs")
//var replace = require("rollup-plugin-replace")
console.log("-----")
rollup({
  entry: "./src/avalon.js",
  plugins: [ commonjs() ]
}).then(function(bundle){


      bundle.write({
        dest: 'dist/index.js',
        moduleName:"avalon",
        format: 'umd'
      });

}).catch(function(e){
  console.log(e)
})
//使用 rollup -c --input src/avalon
