var gulp = require('gulp');
var path = require('path');
var concat = require('gulp-concat')
var replace = require('gulp-replace')


gulp.task('combo', function() {
//https://github.com/isaacs/node-glob
//http://www.linuxjournal.com/content/bash-extended-globbing
    return gulp.src('./src/**/[0-9]*.js', function(a, b) {
        var compatibleFiles = b.filter(function(f) {
            return !/noop|modern|observe|touch/.test(f)
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
                    return  "avalon.js " + version + " built in " + date
                }))
                .pipe(gulp.dest('./dist/'), function() {
                    console.log('合并完毕')
                })
    })

})
gulp.task('default', ['combo']);