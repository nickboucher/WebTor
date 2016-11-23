'use strict';

import gulp from 'gulp';

import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';

import watchify from 'watchify';
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
	html: ['./*.html'],
	worker: ['./worker.js'],
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

function build(watch) {
	let b = watchify(browserify({
			"entries": paths.scripts,
			debug: true,
			basedir: bases.app
		})
		.transform(babelify, { presets: ["es2015"] }));

	function rebundle() {
		return b.bundle()
			.on('error', map_error)
			.pipe(source('bundle.js'))
			.pipe(buffer())
			.pipe(sourcemaps.init({
				loadMaps: true
			}))
			.pipe(uglify())
			.pipe(sourcemaps.write(paths.maps))
			.pipe(gulp.dest(bases.dist + 'scripts/'));
	}

	if (watch) {
		b.on('update', () => {
			console.log('-> bundling...');
			rebundle();
		});
	}

	return rebundle();
}

gulp.task('build', () => {
	return build();
});

gulp.task('html', () => {
	return gulp.src(paths.html, {cwd: bases.app})
		.pipe(gulp.dest(bases.dist));
});

gulp.task('worker', () => {
	return gulp.src(paths.worker, {cwd: bases.app})
		.pipe(gulp.dest(bases.dist));
});

gulp.task('styles', () => {
	return gulp.src(paths.styles, {cwd: bases.app})
		.pipe(gulp.dest(bases.dist + 'styles/'));
});

gulp.task('watch', ['html', 'styles', 'build'], function () {
	gulp.watch(paths.styles, ['styles']);
	gulp.watch(paths.html, ['html']);

	livereload.listen();
	build(true);

	gulp.watch([bases.dist + '**']).on('change', livereload.changed);
});

gulp.task('serve', serve(bases.dist));

gulp.task('default', ['build', 'html', 'styles', 'worker']);
