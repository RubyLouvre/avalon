var gulp = require('gulp');
var path = require('path');
var concat = require('gulp-concat')
var replace = require('gulp-replace')
//http://www.cnblogs.com/code/articles/4103070.html
//https://github.com/basecss/jshint-doc-cn/blob/master/options.md
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
function fixVersion(v) {
    var arr = v.split(".")
    if (arr.length > 2) {
        return arr.shift() + "." + arr.join("")
    }
    return v
}
gulp.task('combo', function () {
//https://github.com/isaacs/node-glob
//http://www.linuxjournal.com/content/bash-extended-globbing
    return gulp.src('./src/**/*.js', function (a, b) {
        var compatibleFiles = b.filter(function (f) {
            return !/\$\$|noop|modern|next|observe|touch/.test(f)
        })

        var version = '1.5.1' //当前版本号
        var now = new Date  //构建日期
        var date = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate()
        gulp.src(compatibleFiles)
                .pipe(concat('avalon.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + fixVersion(version)
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.js " + version + " built in " + date + "\n support IE6+ and other browsers"
                }))
                .pipe(gulp.dest('./'))
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(gulp.dest('../avalon.test/src/'))
                .pipe(uglify())
                .pipe(rename('avalon.modern.min.js'))
                .pipe(gulp.dest('./dist/'))
                .on('error', function (err) {
                    console.log(err.toString());
                    this.emit("end");
                })

        var shimFiles = compatibleFiles.map(function (el) {
           
            return /domReady/.test(el) ? el.replace("domRedy", "domReady.noop") : el
        }).filter(function(el){
            return !/loader/.test(el)
        })
        gulp.src(shimFiles)
                .pipe(concat('avalon.shim.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + fixVersion(version)
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.shim.js " + version + " built in " + date + "\n support IE6+ and other browsers"
                }))
                .pipe(gulp.dest('./dist'))

        var modernFiles = compatibleFiles.filter(function (el) {
            return !/shim/.test(el)
        })

        replaceUrls(modernFiles, {
            "01 variable": "01 variable.modern",
            "02 core": "02 core.modern",
            "05 dom.polyfill": "05 dom.polyfill.modern",
            "08 modelFactory": "08 modelFactory.modern",
            "15 HTML": "15 HTML.modern",
            "16 dom": "16 dom.modern",
            "17 quote": "17 quote.modern",
            "18 scanAttr": "18 scanAttr.modern",
            "18 scanTag": "18 scanTag.modern",
            "21 loader": "21 loader.modern",
            "text": "text.modern",
            "duplex": "duplex.modern",
            "include": "include.modern",
            "22 domReady": "22 domReady.modern"
        })

        gulp.src(modernFiles)
                .pipe(concat('avalon.modern.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + fixVersion(version)
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.modern.js " + version + " built in " + date + "\n support IE10+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))
                .pipe(gulp.dest('../avalon.test/src/'))
                .pipe(uglify())
                .pipe(rename('avalon.modern.min.js'))
                .pipe(gulp.dest('./dist/'))


        var modernShimFiles = modernFiles.map(function (el) {
            return /domReady/.test(el) ? el.replace("domRedy.modern", "domReady.noop") : el
        }).filter(function(el){
            return !/loader/.test(el)
        })

        gulp.src(modernShimFiles)
                .pipe(concat('avalon.modern.shim.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + fixVersion(version)
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.modern.js " + version + " built in " + date + "\n support IE10+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))
                .pipe(gulp.dest('../avalon.test/src/'))
                

    })



})
gulp.task('default', ['combo'], function () {
    console.log('合并完毕')
});
