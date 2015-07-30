// include gulp
var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');

// JS hint task
gulp.task('jshint', function() {
  gulp.src('./js/main.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// minify map icons
gulp.task('iconmin', function() {
  var imgSrc = './img/icons/*',
      imgDst = './build/img/icons'

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
})

// minify photoswipe png images
gulp.task('pswppngmin', function() {
  var imgSrc = './photoswipe/default-skin/*.png',
      imgDst = './build/photoswipe/default-skin'

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
})

// minify photoswipe gif images
gulp.task('pswpgifmin', function() {
  var imgSrc = './photoswipe/default-skin/*.gif',
      imgDst = './build/photoswipe/default-skin'

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
})

// minify new images, include map icons
gulp.task('imagemin', ['iconmin','pswppngmin','pswpgifmin'], function() {
  var imgSrc = './img/*',
      imgDst = './build/img';

  gulp.src(imgSrc)
    .pipe(changed(imgDst))
    .pipe(imagemin())
    .pipe(gulp.dest(imgDst));
});

// minify new or changed HTML pages
gulp.task('htmlmin', function() {
  var htmlSrc = './*.html',
      htmlDst = './build';

  gulp.src(htmlSrc)
    .pipe(changed(htmlDst))
    .pipe(minifyHTML())
    .pipe(gulp.dest(htmlDst));
});

// Photoswipe minfiy skin css
gulp.task('pswpskcss', function() {
  var cssSrc = ['./photoswipe/default-skin/*.css'],
      cssDst = './build/photoswipe/default-skin';

  gulp.src(cssSrc)
    .pipe(changed(cssDst))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// Photoswipe minfiy main css
gulp.task('pswpcss', function() {
  var cssSrc = ['./photoswipe/*.css'],
      cssDst = './build/photoswipe';

  gulp.src(cssSrc)
    .pipe(changed(cssDst))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// minify new or changed CSS pages
gulp.task('cssmin', ['pswpskcss', 'pswpcss'], function() {
  var cssSrc = './css/*.css',
      cssDst = './build/css';

  gulp.src(cssSrc)
    .pipe(changed(cssDst))
    .pipe(minifyCSS())
    .pipe(gulp.dest(cssDst));
});

// Photoswipe JS strip debugging and minify
gulp.task('pswpJS', function() {
  var jsSrc = './photoswipe/*.js',
      jsDst = './build/photoswipe';

  gulp.src(jsSrc)
    .pipe(changed(jsDst))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(jsDst));
});

// JS strip debugging and minify include photoswip JS
gulp.task('scripts', ['pswpJS'], function() {
  var jsSrc = './js/*.js',
      jsDst = './build/js';

  gulp.src(jsSrc)
    .pipe(changed(jsDst))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest(jsDst));
});