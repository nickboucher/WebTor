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

import mocha from 'gulp-mocha';

var bases = {
	app: 'app/',
	webdist: 'dist/web/',
	nodedist: 'dist/node/'
};

var paths = {
	app: ['./index.js'],
	bridge: ['./server.js'],
	html: ['./*.html'],
	worker: ['./worker.js'],
	styles: ['./styles/**/*.css'],
	tests: ['./test/**/*.js'],
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

function build_app(watch) {
	let b = watchify(browserify({
			"entries": paths.app,
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
			.pipe(gulp.dest(bases.webdist));
	}

	if (watch) {
		b.on('update', () => {
			console.log('-> bundling...');
			rebundle();
		});
	}

	return rebundle();
}

function build_bridge(watch) {
	let b = watchify(browserify({
			"entries": paths.bridge,
			debug: true,
			builtins: false,
			basedir: bases.app,
			insertGlobalVars: {
				process: function() { return; }
			}
		})
		.transform(babelify, { presets: ["es2015"] }));

	function rebundle() {
		return b.bundle()
			.on('error', map_error)
			.pipe(source('bridge.js'))
			.pipe(buffer())
			.pipe(sourcemaps.init({
				loadMaps: true
			}))
			.pipe(uglify())
			.pipe(sourcemaps.write(paths.maps))
			.pipe(gulp.dest(bases.nodedist));
	}

	if (watch) {
		b.on('update', () => {
			console.log('-> bundling...');
			rebundle();
		});
	}

	return rebundle();
}

gulp.task('app', () => {
	return build_app();
});

gulp.task('bridge', () => {
	return build_bridge();
});

gulp.task('html', () => {
	return gulp.src(paths.html, {cwd: bases.app})
		.pipe(gulp.dest(bases.webdist));
});

gulp.task('worker', () => {
	return gulp.src(paths.worker, {cwd: bases.app})
		.pipe(gulp.dest(bases.webdist));
});

gulp.task('styles', () => {
	return gulp.src(paths.styles, {cwd: bases.app})
		.pipe(gulp.dest(bases.webdist));
});

gulp.task('test', () => {
	return gulp.src(paths.tests, {cwd: bases.app})
		.pipe(mocha({
			compilers: [
				'js:babel-core/register',
			]
		}));
});

gulp.task('watch', ['app', 'bridge', 'html', 'styles', 'worker'], function () {
	gulp.watch(paths.styles, ['styles']);
	gulp.watch(paths.html, ['html']);

	livereload.listen();
	build_app(true);
	build_bridge(true);

	gulp.watch([bases.webdist + '**']).on('change', livereload.changed);
});

gulp.task('serve', serve(bases.webdist));

gulp.task('default', ['app', 'bridge', 'html', 'styles', 'worker']);

gulp.on('stop', () => { process.exit(0); });
gulp.on('err', () => { process.exit(1); });