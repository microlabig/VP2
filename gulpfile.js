// импортируем gulp
const { src, dest, task, series, watch, parallel } = require('gulp');
// импортируем плагины
const rm = require('gulp-rm'),    // удаление файлов
    sass = require('gulp-sass'), // SASS
    concat = require('gulp-concat'), // соединение файлов в один
    browserSync = require('browser-sync').create(), // dev-Server
    reload = browserSync.reload, // функция перезагрузки dev-Server
    sassGlob = require('gulp-sass-glob'), // продвинутый импорт стилей
    autoprefixer = require('gulp-autoprefixer'), // автопрефиксер
    px2rem = require('gulp-smile-px2rem'), // перевод из px в rem
    gcmq = require('gulp-group-css-media-queries'), // группировка одинаковых медиазапросов  
    cleanCSS = require('gulp-clean-css'), // минификация css
    sourcemaps = require('gulp-sourcemaps'), // source maps
    babel = require('gulp-babel'), // ES 6 -> браузеросовместимый код
    uglify = require('gulp-uglify'), // минификация js
    notify = require("gulp-notify"), // уведомления 
    wait = require('gulp-wait2'), // задержка
    // svgo = require('gulp-svgo'), // оптимизация svg
    // svgSprite = require('gulp-svg-sprite'), // объединения всех svg в один
    gulpif = require('gulp-if'), // плагин условия
    browserify = require('gulp-browserify'), // используется для преобразования 'require'
    pug = require('gulp-pug'), // шаблонизатор pug
    eslint = require('gulp-eslint'); // проверка кода

const env = process.env.NODE_ENV; // env - переменная из переменных окружения node.js, определяется в package.json

// импортируем настройки из gulp.config.js
const { SRC_PATH, DIST_PATH, STYLES_LIBS, JS_LIBS } = require('./gulp.config');

// укажем компилятор для SASS
sass.compiler = require('node-sass');

// таск очистки
task('clean', () => {
    return src(`${DIST_PATH}/**/*`, { read: false }).pipe(rm());
});

task('pug', () => {
    return src(`${SRC_PATH}/pages/index.pug`)
        .pipe(pug({ pretty: true }))
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({ stream: true }));
});

// таск стилей
task('styles', () => {
    return src([...STYLES_LIBS, `${SRC_PATH}/styles/main.scss`])
        .pipe(gulpif(env === 'dev', sourcemaps.init()))
        .pipe(concat('normalize.css'))
        .pipe(concat('main.min.scss'))
        .pipe(sassGlob())
        //.pipe(sass().on('error', sass.logError))
        .pipe(wait(1500))
        .pipe(sass({ outputStyle: 'expand' }).on("error", notify.onError()))
        .pipe(px2rem({
            dpr: 1,             // base device pixel ratio (default: 2)
            rem: 16,            // root element (html) font-size (default: 16)
            one: false          // whether convert 1px to rem (default: false)
        }))
        .pipe(gulpif(env === 'build', autoprefixer({ cascade: false })))
        .pipe(gulpif(env === 'build', gcmq()))
        .pipe(gulpif(env === 'build', cleanCSS()))
        .pipe(gulpif(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({ stream: true }));
});

// таск скриптов
task('scripts', () => {
    return src([...JS_LIBS, `${SRC_PATH}/scripts/**/*.js`])
    //return src([...JS_LIBS, `${SRC_PATH}/scripts/main.js`])
        .pipe(gulpif(env === 'dev', sourcemaps.init()))
        //.pipe(concat('main.min.js', { newLine: ";" }))
        // .pipe(gulpif(env === 'build', babel(
        //     {
        //         presets: [
        //             [
        //                 "@babel/preset-env", {
        //                     "targets": {
        //                         "browsers": ["last 2 versions"]
        //                     },
        //                     // "debug": true,
        //                     "modules": "commonjs"
        //                 }
        //             ]
        //         ],
        //         plugins: [
        //             ["@babel/plugin-transform-runtime", { "regenerator": true }]
        //         ]
        //     }
        // )))
        // .pipe(gulpif(env === 'build', browserify({
        //     insertGlobals: true
        // })))
        // .pipe(gulpif(env === 'build', uglify()))
        .pipe(gulpif(env === 'dev', sourcemaps.write()))
        .pipe(dest(`${DIST_PATH}/scripts`))
        //.pipe(dest(`${DIST_PATH}/main.min.js`))
        .pipe(reload({ stream: true }));
});

task('eslint', () => {
    return src([...JS_LIBS, `${SRC_PATH}/scripts/**/*.js`])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
})

// таск иконок
/* task('icons', () => {
    return src(`${SRC_PATH}/images/icons/*.svg`)
    .pipe(svgo({
        plugins: [
            {
                removeAttr: {
                    attrs: "(fill|stroke|style|width|height|data.*)"
                }
            }
        ]
    }))
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: "../sprite.svg"
            }
        }
    }))
    .pipe(dest(`${DIST_PATH}/images/icons`))
}); */

// таск копирования изображений
task("copy:img", () => {
    return src(`${SRC_PATH}/images/*.*`)
        .pipe(dest(`${DIST_PATH}/images`))
        .pipe(reload({ stream: true })); // перезагрузим браузер (задача выполняется внутри потока (stream:true))
});

// таск копирования иконки сайта
task("copy:favicon", () => {
    return src(`${SRC_PATH}/images/favicon/favicon.*`)
        .pipe(dest(`${DIST_PATH}`))
        .pipe(reload({ stream: true })); // перезагрузим браузер (задача выполняется внутри потока (stream:true))
});

// таск копирования шрифтов
task("copy:fonts", () => {
    return src(`${SRC_PATH}/fonts/**/*.*`)
        .pipe(dest(`${DIST_PATH}/fonts`))
        .pipe(reload({ stream: true })); // перезагрузим браузер (задача выполняется внутри потока (stream:true))
});

// // таск копирования шрифтов
// task("copy:html", () => {
//     return src(`${SRC_PATH}/pages/**/*.*`)
//         .pipe(dest(`${DIST_PATH}`))
//         .pipe(reload({ stream: true })); // перезагрузим браузер (задача выполняется внутри потока (stream:true))
// });

// таск дев-сервера
task('server', () => {
    browserSync.init({
        server: {
            baseDir: `./${DIST_PATH}`
        },
        open: false,
        ghostMode: false, // для отключения синхронизации в случае открытия нескольких окон
//	port: PORT, // порт
//	notify: false // уведомление об обновлении браузера
    });
});

// -------
// вотчеры
// -------
task('watch', () => {
    watch(`./${SRC_PATH}/pages/**/*.pug`, series('pug'));
    //watch(`./${SRC_PATH}/pages/**/*.html`, series('copy:html'));
    watch(`./${SRC_PATH}/styles/**/*.scss`, series('styles'));
    watch(`./${SRC_PATH}/scripts/**/*.js`, series('scripts'));
    //watch(`./${SRC_PATH}/images/icons/**/*.svg`, series('icons'));
})

// ----------------
// сценарии запуска
// ----------------
// таск по умолчанию (gulp) - development
task('default',
    series('clean',
        parallel('copy:img', 'copy:fonts', 'copy:favicon'),
        parallel('styles', 'scripts', 'pug'),
        parallel('watch', 'server')
    )
);

// таск build - production
task('build',
    series('clean',
        parallel('copy:img', 'copy:fonts', 'copy:favicon'),
        parallel('styles', 'scripts', 'pug')
    )
);

// таск checkJS - проверка кода
task('codestyle',
    series('eslint')
);


