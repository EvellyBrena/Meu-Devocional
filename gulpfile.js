const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const brotli = require('gulp-brotli');
const rename = require('gulp-rename');
var minifyInline = require('gulp-minify-inline');
const babel = require('gulp-babel');

// Paths
const paths = {
  html: 'frontend/**/*.html',
  css: 'frontend/**/*.css',
  js: 'frontend/**/*.js',
  output: 'dist'
};

// Minify HTML
function minifyHTML() {
  return gulp
    .src(paths.html)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(minifyInline())
    .pipe(gulp.dest(paths.output));
}

// Minify CSS
function minifyCSS() {
  return gulp
    .src(paths.css)
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.output));
}

// Minify JS
function minifyJS() {
  return gulp
    .src(paths.js)
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(terser())
    .pipe(gulp.dest(paths.output));
}

// Compress with Brotli
function compress() {
  return gulp
    .src(`${paths.output}/**/*.{html,css,js}`)
    .pipe(brotli.compress({
      quality: 11
    }))
    .pipe(rename({ extname: '.br' }))
    .pipe(gulp.dest(paths.output));
}

// Define tasks
exports.default = gulp.series(minifyHTML, minifyCSS, minifyJS, compress);
