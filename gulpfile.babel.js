'use strict';

import gulp from 'gulp';

import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';

import watch from 'gulp-watch';
import serve from 'gulp-serve';
import livereload from 'gulp-livereload';

import gutil from 'gulp-util';
import chalk from 'chalk';

var bases = {
	app: 'app/',
	dist: 'dist/',
};

var paths = {
	scripts: ['./scripts/index.js'],
	html: ['./index.html'],
	styles: ['./styles/**/*.css'],
	maps: './maps',
};

function map_error(err) {
	if (err.fileName) {
		gutil.log(chalk.red(err.name)
		   	+ ': '
			+ chalk.yellow(err.fileName.replace(__dirname + bases.app, ''))
			+ ': ',
			+ 'Line ',
			+ chalk.magenta(err.lineNumber)
			+ ' & '
			+ 'Column '
			+ chalk.magenta(err.columnNumber || err.column)
			+ ': '
			+ chalk.blue(err.description));
	} else {
		gutil.log(chalk.red(err.name)
			+ ': '
			+ chalk.yellow(err.message));
	}
}

gulp.task('build', () => {
	return browserify({
			"entries": paths.scripts,
			debug: true,
			basedir: bases.app,
		})
		.transform("babelify", { presets: ["es2015"] })
		.bundle()
		.on('error', map_error)
		.pipe(source('index.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(sourcemaps.write(paths.maps))
		.pipe(gulp.dest(bases.dist + 'scripts/'))
		.pipe(livereload());
});

gulp.task('html', () => {
	gulp.src(paths.html, {cwd: bases.app})
		.pipe(gulp.dest(bases.dist));
});

gulp.task('styles', () => {
	gulp.src(paths.styles, {cwd: bases.app})
		.pipe(gulp.dest(bases.dist + 'styles/'));
});

gulp.task('watch', ['html', 'styles', 'build'], function () {
	livereload.listen();

	watch(paths.scripts, ['build']);
});

gulp.task('serve', serve(bases.dist));

gulp.task('default', ['watch']);
