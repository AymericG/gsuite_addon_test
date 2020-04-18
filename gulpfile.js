const gulp = require('gulp');
const exec = require('child_process').exec;
const dep_id = "";

gulp.task('push', function(done){
    exec('clasp push -f', function(err){
        done(err);
    });
});

// gulp.task('deploy', function(done){
//     exec('clasp deploy -i ' + dep_id + ' -d "auto-update from local gulp"', function(err){
//         done(err);
//     });
// });

gulp.task('watch', function(done){
    gulp.watch([
        '**/*.gs',
        '**/*.html'
    ], gulp.series('push'));
});

gulp.task('default', gulp.series('watch'));