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

gulp.task('combo', function () {
//https://github.com/isaacs/node-glob
//http://www.linuxjournal.com/content/bash-extended-globbing
    return gulp.src('./src/**/*.js', function (a, b) {
        var compatibleFiles = b.filter(function (f) {
            return !/\$\$|noop|modern|next|observe|touch/.test(f)
        })

        var version = 1.46 //当前版本号
        var now = new Date  //构建日期
        var date = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate()

        gulp.src(compatibleFiles)
                .pipe(concat('avalon.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.js " + version + " built in " + date + "\n support IE6+ and other browsers"
                }))
                .pipe(gulp.dest('./'))
                .pipe(gulp.dest('./dist/'))
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(gulp.dest('../avalon.test/src/'))
                .pipe(uglify())
                .pipe(rename('avalon.min.js'))
                .pipe(gulp.dest('./dist/'))

        var $$pathName = compatibleFiles[0]
        $$pathName = $$pathName.slice(0, $$pathName.lastIndexOf("00"))
        var fixPath = function (name) {
            return path.join($$pathName, name + ".js")
        }

        //avalon.shim.js 所需要合并的子文件
        var shimFiles = compatibleFiles.slice(0, -3).concat(fixPath("22 domReady.noop"), fixPath("24 outer"))
        gulp.src(shimFiles)
                .pipe(concat('avalon.shim.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.shim.js(无加载器版本) " + version + " built in " + date + "\n support IE6+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))

        //avalon.modern.js 所需要合并的子文件
        var modernFiles = compatibleFiles.filter(function (el) {
            return !/shim/.test(el)
        })

        replaceUrls(modernFiles, {
            "01 variable": "01 variable.modern",
            "02 core": "02 core.modern",
            "05 dom.polyfill": "05 dom.polyfill.modern",
            "07 EventBus": "07 EventBus.modern",
            "08 modelFactory": "08 modelFactory.modern",
            "15 HTML": "15 HTML.modern",
            "16 dom": "16 dom.modern",
            "17 parser": "17 parser.modern",
            "18 scanAttr": "18 scanAttr.modern",
            "18 scanTag": "18 scanTag.modern",
            "21 loader": "21 loader.modern",
            "text": "text.modern",
            "duplex.2": "duplex.2.modern",
            "22 domReady": "22 domReady.modern"
        })

        gulp.src(modernFiles)
                .pipe(concat('avalon.modern.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.modern.js " + version + " built in " + date + "\n support IE10+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))
                .pipe(gulp.dest('../avalon.test/src/'))
                .pipe(uglify())
                .pipe(rename('avalon.modern.min.js'))
                .pipe(gulp.dest('./dist/'))

        var modernShimFiles = modernFiles.slice(0, -3).concat(fixPath("22 domReady.noop"), fixPath("24 outer"))

        gulp.src(modernShimFiles)
                .pipe(concat('avalon.modern.shim.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/loader:\s*true/, "loader: false"))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.modern.shim.js(无加载器版本) " + version + " built in " + date + "\n support IE10+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))


        //avalon.mobiles.js 所需要合并的子文件
        var mobileFiles = modernFiles.concat()

        mobileFiles.pop()
        mobileFiles.push(fixPath("23 touch"), fixPath("24 outer"))

        gulp.src(mobileFiles)
                .pipe(concat('avalon.mobile.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.mobile.js " + version + " built in " + date + "\n support IE10+ and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
                .pipe(uglify())
                .pipe(rename('avalon.mobile.min.js'))
                .pipe(gulp.dest('./dist/'))


        //avalon.mobiles.shim.js 所需要合并的子文件
        var mobileShimFiles = modernFiles.slice(0, -3).concat(fixPath("22 domReady.noop"), fixPath("23 touch"), fixPath("24 outer"))
        console.log(mobileShimFiles)

        gulp.src(mobileShimFiles)
                .pipe(concat('avalon.mobile.shim.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/loader:\s*true/, "loader: false"))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.mobile.shim.js " + version + " built in " + date
                }))
                .pipe(gulp.dest('./dist/'))

        //avalon.mobiles.old.js 所需要合并的子文件
        var mobileOldFiles = compatibleFiles.concat()
        mobileOldFiles.pop()
        mobileOldFiles.push(fixPath("23 touch"), fixPath("24 outer"))

        gulp.src(mobileOldFiles)
                .pipe(concat('avalon.mobile.old.js'))
                .pipe(replace(/version:\s+([\d\.]+)/, function (a, b) {
                    return "version: " + version
                }))
                .pipe(replace(/!!/, function (a, b) {
                    return  "avalon.mobile.old.js " + version + " built in " + date + "\n support IE8 and other browsers"
                }))
                .pipe(gulp.dest('./dist/'))

    })



})
gulp.task('default', ['combo'], function () {
    console.log('合并完毕')
});
