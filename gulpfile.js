// include gulp
var gulp = require('gulp'); 
 
// include plug-ins
var jshint = require('gulp-jshint');
//var changed = require('gulp-changed');
//var imagemin = require('gulp-imagemin');
//var minifyHTML = require('gulp-minify-html');
//var minifyCSS = require('gulp-minify-css');
//var stripDebug = require('gulp-strip-debug');
//var uglify = require('gulp-uglify');
var serve = require('gulp-serve');
var browserSync = require('browser-sync');
 
// JS hint task
gulp.task('jshint', function() {
  gulp.src('./views/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// minify new images
gulp.task('imagemin', function() {
  var imgSrc = './img/*',
      imgDst = './minified/img';
 
  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});

// minify new images for pizza.html
gulp.task('views-imagemin', function() {
  var imgSrc = './views/images/*',
      imgDst = './minified/views/images';
 
  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});
 
// minify new or changed HTML pages
gulp.task('htmlpage', function() {
  var htmlSrc = './*.html',
      htmlDst = './minified';
 
  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// minify new or changed HTML pages for pizza.html
gulp.task('views-html', function() {
  var htmlSrc = './views/*.html',
      htmlDst = './minified/views';
 
  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// minify new or changed CSS pages
gulp.task('cssmin', function() {
  var cssSrc = './css/*.css',
      cssDst = './minified/css';
 
  gulp.src(cssSrc)
    .pipe(changed(cssDst))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// minify new or changed CSS pages
gulp.task('views-cssmin', function() {
  var cssSrc = './views/css/*.css',
      cssDst = './minified/views/css';
 
  gulp.src(cssSrc)
    .pipe(changed(cssDst))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// JS strip debugging and minify
gulp.task('scripts', function() {
  var jsSrc = './js/*.js',
      jsDst = './minified/js';

  gulp.src(jsSrc)
    .pipe(changed(jsDst))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(jsDst));
});

// JS strip debugging and minify
gulp.task('views-scripts', function() {
  var jsSrc = './views/js/*.js',
      jsDst = './minified/views/js';

  gulp.src(jsSrc)
    .pipe(changed(jsDst))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(jsDst));
});

// Static server
gulp.task('serve', function() {
    browserSync.init({
      server: {
        baseDir: "php",
        index: "request.php"
      },
      port: 8080
    });
});