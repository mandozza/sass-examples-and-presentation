// Gulp.js configuration

// include gulp and plugins
var
	gulp = require('gulp'),
	phpcs = require('gulp-phpcs'),
	newer = require('gulp-newer'),
	concat = require('gulp-concat'),
	preprocess = require('gulp-preprocess'),
	imagemin = require('gulp-imagemin'),
	sass = require('gulp-sass'),
	pleeease = require('gulp-pleeease'),
	jshint = require('gulp-jshint'),
	deporder = require('gulp-deporder'),
	stripdebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	critical = require('critical'),
	size = require('gulp-size'),
	del = require('del'),
	plumber = require('gulp-plumber'),
	htmlclean = require('gulp-htmlclean'),
	browsersync = require('browser-sync');
	pkg = require('./package.json');

// file locations
//NODE_ENV=development npm start
var
	devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),
	source = 'build/',
	dest = 'app/',
	themeCssLocation = 'ncc_radio_theme/assets/css/',
	themeJsLocation = 'ncc_radio_theme/assets/js/',
	wpPluginLocation = '',
	wpThemeLocation = 'ncc_radio_theme',

	php = {
		 watch: ['../app/public/wp-content/themes/' + 		wpThemeLocation + '*.php', '/app/public/wp-content/themes/' + 		wpThemeLocation + '**/*.php']
	},

	html = {
		in: source + '*.html',
		watch: [source + '*.html', source + 'assets/_templates/**/*'],
		out: dest,
		context: {
			devBuild: devBuild,
			author: pkg.author,
			version: pkg.version
		}
	},

	images = {
		in: source + 'assets/img/*.*',
		out: dest + 'assets/img/'
	},

	css = {
		in: source + 'assets/_sass/style.scss',
		watch: [source + 'assets/_sass/**/*'],
		out: dest + 'assets/css/',
		sassOpts: {
			outputStyle: 'compressed',
			imagePath: '../images',
			precision: 3,
			errLogToConsole: true
		},
		pleeeaseOpts: {
			autoprefixer: { browsers: ['last 2 versions', '> 2%'] },
			rem: ['16px'],
			pseudoElements: true,
			mqpacker: true,
			minifier: !devBuild
		}
	},

	js = {
		in: source + 'assets/js/**/*',
		out: dest + 'assets/js/',
		filename: 'custom.min.js'
	},

	syncOpts = {
		server: {
			baseDir: dest,
			index: 'index.html'
		},
		open: false,
		notify: true
	};

// show build type
console.log(pkg.name + ' ' + pkg.version + ', ' + (devBuild ? 'development' : 'production') + ' build');

// clean the build folder
gulp.task('clean', function() {
	del([
		dest + '*'
	]);
});


gulp.task('phpcs', function () {
    return gulp.src(['../app/public/wp-content/themes/' + 		wpThemeLocation , '../app/public/wp-content/themes/' + 		wpThemeLocation + '/**/*.*'])
        // Validate files using PHP Code Sniffer
        .pipe(phpcs({
            bin: '../../../Utilities/phpcs',
            standard: 'WordPress',
            warningSeverity: 0
        }))
        // Log all problems that was found
        .pipe(phpcs.reporter('log'));
});



//Critical  Path CSS
gulp.task('critical', function (cb) {
  critical.generate({
    base: 'build/',
    src: 'index.html',
    css: ['app/assets/css/style.css'],
    dimensions: [{
      width: 320,
      height: 480
    },{
      width: 768,
      height: 1024
    },{
      width: 1280,
      height: 960
    }],
    dest: 'app/assets/css/critical.css',
    minify: true,
    extract: false,
    ignore: ['@font-face',/url\(/]
  });
});

// build HTML files
gulp.task('html', function() {
	var page = gulp.src(html.in).pipe(preprocess({ context: html.context }));
	//if (!devBuild) {
		page = page
			.pipe(size({ title: 'HTML in' }))
			.pipe(plumber())
			.pipe(htmlclean())
			.pipe(size({ title: 'HTML out' }));
	//}
	return page.pipe(gulp.dest(html.out));
});

// manage images
gulp.task('images', function() {
	return gulp.src(images.in)
		.pipe(newer(images.out))
		.pipe(imagemin())
		.pipe(gulp.dest(images.out));
});
// compile Sass
gulp.task('sass', function() {
	return gulp.src(css.in)
		.pipe(plumber({
	        errorHandler: function (err) {
	            console.log(err);
	            this.emit('end');
	        }
	    }))
		.pipe(sass(css.sassOpts))
		.pipe(size({title: 'CSS in '}))
		.pipe(pleeease(css.pleeeaseOpts))
		.pipe(size({title: 'CSS out '}))
		.pipe(gulp.dest(css.out))
		.pipe(browsersync.reload({ stream: true }));
});

//copy css move to theme folder
gulp.task('copycss', function() {
   gulp.src(dest + 'assets/css/*')
   .pipe(gulp.dest('../app/public/wp-content/themes/' + themeCssLocation));
});
//copy js move to theme folder
gulp.task('copyjs', function() {
   gulp.src(dest + 'assets/js/*')
   .pipe(gulp.dest('../app/public/wp-content/themes/' + themeJsLocation));
});

//copy sass move to theme folder
gulp.task('copysass', function() {
   gulp.src(source + 'assets/_sass/**/*')
   .pipe(gulp.dest('../app/public/wp-content/themes/' + themeJsLocation + '/sass'));
});


gulp.task('js', function() {
	if (devBuild) {
		return gulp.src(js.in)
			.pipe(newer(js.out))
			.pipe(jshint())
			.pipe(jshint.reporter('default'))
			.pipe(jshint.reporter('fail'))
			.pipe(gulp.dest(js.out));
	}
	else {
		del([
			dest + 'assets/js/*'
		]);
		return gulp.src(js.in)
			.pipe(deporder())
			.pipe(concat(js.filename))
			.pipe(size({ title: 'JS in '}))
			.pipe(stripdebug())
			.pipe(uglify())
			.pipe(size({ title: 'JS out '}))
			.pipe(gulp.dest(js.out));
	}
});

// browser sync
gulp.task('browsersync', function() {
	browsersync(syncOpts);
});

// default task
gulp.task('default', ['html', 'images', 'sass', 'js', 'copycss', 'copyjs'  ,'browsersync'], function() {

	// html changes
	gulp.watch(html.watch, ['html', browsersync.reload]);

	// image changes
	gulp.watch(images.in, ['images']);

	// sass changes
	gulp.watch([css.watch], ['sass', 'copycss']);

	// phpchanges
	gulp.watch([php.watch], ['phpcs']);

	// javascript changes
	gulp.watch(js.in, ['js','copyjs', browsersync.reload]);

});


