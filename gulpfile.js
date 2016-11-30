'use strict';
const gulp = require('gulp');
gulp.task('build', () => {
    gulp.src(['node_modules/bootstrap/dist/*/*.min.*', 'app/*/*.*', 'app/*.*']).pipe(gulp.dest('dist'));
    gulp.src('node_modules/jquery/dist/jquery.min.*').pipe(gulp.dest('dist/js'));
    gulp.src('node_modules/bootstrap/dist/fonts/*.*').pipe(gulp.dest('dist/fonts'));
    gulp.src('app/_locales/*/*.*').pipe(gulp.dest('dist/_locales'));
});
gulp.task('default', () => {
    gulp.watch(['app/*/*.*', 'app/*.*', 'app/_locales/*/*.*'], ['build']);
});
