// Gulp.js configuration

// include gulp and plugins
var
	gulp = require('gulp'),
	sass = require('gulp-sass'),
	browsersync = require('browser-sync');
	pkg = require('./package.json');


var	source = 'build/',
	dest = 'build/',
	css = {
		in: source + 'assets/Sass/style.scss',
		watch: [source + 'assets/Sass/**/*'],
		out: dest + 'assets/css/',
		sassOpts: {
			outputStyle: 'nested',
			imagePath: '../images',
			precision: 3,
			errLogToConsole: true
		}
	},
	html = {
		in: source + '*.html',
		watch: [source + '*.html'],
		out: dest
	},
	syncOpts = {
		server: {
			baseDir: dest,
			index: 'index.html'
		},
		open: false,
		notify: true
	};


// compile Sass
gulp.task('sass', function() {
	return gulp.src(css.in)
		.pipe(sass(css.sassOpts))
		.pipe(gulp.dest(css.out))
		.pipe(browsersync.reload({ stream: true }));
});

// browser sync
gulp.task('browsersync', function() {
	browsersync(syncOpts);
});

// default task
gulp.task('default', ['sass','browsersync'], function() {
	// sass changes
	gulp.watch(html.watch, [browsersync.reload]);
	gulp.watch([css.watch], ['sass']);

});


