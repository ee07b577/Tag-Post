'use strict';
const gulp = require('gulp');
gulp.task('build', () => {
    gulp.src(['node_modules/bootstrap/dist/*/*.*']).pipe(gulp.dest('dist'));
    gulp.src(['node_modules/jquery/dist/*.*']).pipe(gulp.dest('dist/js'));
    gulp.src(['app/*/*.*', 'app/*.*']).pipe(gulp.dest('dist'));
    gulp.src('app/_locales/*/*.*').pipe(gulp.dest('dist/_locales'));
});
gulp.task('default', () => {
    gulp.watch(['app/*/*.*', 'app/*.*'], ['build']);
});
