var gulp = require('gulp');
var path = require('path');
var concat = require('gulp-concat')
var replace = require('gulp-replace')
//http://www.cnblogs.com/code/articles/4103070.html
var jshint = require('gulp-jshint')
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

function replaceUrls(array, hash) {
    for (var i = 0, href; href = array[i]; i++) {
        for (var key in hash) {
            if (href.indexOf(key) !== -1) {
                array[i] = href.replace(key, hash[key])
                delete hash[key]
                continue
            }
        }
    }
}

gulp.task('combo', function() {
//https://github.com/isaacs/node-glob
//http://www.linuxjournal.com/content/bash-extended-globbing
    return gulp.src('./src/**/*.js', function(a, b) {
        var compatibleFiles = b.filter(function(f) {
            return !/\$\$|noop|modern|observe|touch/.test(f)
        })
        var version = 1.391 //当前版本号
        var now = new Date  //构建日期
        var date = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate()

        gulp.src(compatibleFiles)
                .pipe(concat('avalon.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function(a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function(a, b) {
                    return  "avalon.js " + version + " built in " + date + "\n support IE6+ and other browsers"
                }))

                .pipe(gulp.dest('./'))
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(uglify())
                .pipe(rename('avalon.min.js'))
                .pipe(gulp.dest('./min/'))

        var $$pathName = compatibleFiles[0]
       $$pathName = $$pathName.slice(0, $$pathName.indexOf(path.sep) + 1)
        var fixPath = function(name) {
            return path.join($$pathName, name +".js")
        }


        //avalon.shim.js 所需要合并的子文件
//        var shimFiles = compatibleFiles.slice(0, -3).concat(fixPath("18 domReady.noop"), fixPath("19 outer"))
//
//        gulp.src(shimFiles)
//                .pipe(concat('avalon.shim.js'))
//                .pipe(replace(/version:\s+([\d\.]+)/, function(a, b) {
//                    return "version: " + version
//                }))
//                .pipe(replace(/!!/, function(a, b) {
//                    return  "avalon.modern.js(无加载器版本) " + version + " built in " + date + "\n support IE6+ and other browsers"
//                }))
//                .pipe(gulp.dest('./'))
//                .pipe(jshint())
//                .pipe(jshint.reporter('default'))
//                .pipe(uglify())
//                .pipe(rename('avalon.shim.min.js'))
//                .pipe(gulp.dest('./min/'))
//
        //avalon.modern.js 所需要合并的子文件
//        var modernFiles = compatibleFiles.filter(function(el) {
//            if (el.indexOf("03 es5.shim") == -1 || el.indexOf("07 modelFactory.shim") == -1) {
//                return false
//            }
//            return true
//        })

//        replaceUrls(modernFiles, {
//            "01 variable": "01 variable.modern",
//            "02 core": "02 core.modern",
//            "04 dom.polyfill": "04 dom.polyfill.modern",
//            "06 findNodes": "06 findNodes.modern",
//            "10 HTML": "10 HTML.modern",
//            "12 scanAttr": "12 scanAttr.modern",
//            "12 scanTag": "12 scanTag.modern",
//            "13 dom": "13 dom.modern",
//            "14 parser": "14 parser.modern",
//            "17 loader": "17 loader.modern",
//            "text": "text.modern",
//            "duplex.2": "duplex.2.modern",
//            "18 domReady": "18 domReady.modern"
//        })


    })

})
gulp.task('default', ['combo'], function() {
    console.log('合并完毕')
});