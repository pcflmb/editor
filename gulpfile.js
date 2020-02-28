/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("underscore");
const $ = require("gulp-load-plugins")();
const gulp = require("gulp");
const path = require("path");
const rename = require("gulp-rename");
const merge = require("merge-stream");
const deepExtend = require("deep-extend");
const runSequence = require("run-sequence");
const autoprefixer = require("autoprefixer-core");

const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const { watch, series } = gulp;

//###################
//# CONFIG
//###################

var config = {
  paths: {
    app: "app",
    tmp: ".tmp",
    dist: "dist",
    scripts: "app/scripts",
    styles: "app/styles",
    assets: "app/assets"
  },

  serverPort: 9000,

  webpack() {
    return {
      resolveLoader: {
        modules: ['node_modules'],
      },

      output: {
        path: path.join(__dirname, config.paths.tmp),
        filename: "bundle.js",
      },

      resolve: {
        extensions: [".js", ".ts", ".tsx", ".scss", ".css", ".ttf"],
        alias: {
          "assets": path.join(__dirname, config.paths.assets)
        }
      },

      module: {
        rules: [
          { test: /\.scss$/, use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"] },
          { test: /\.tsx?$/, use: ["ts-loader"] },
          { test: /\.png/, use: ["url-loader?mimetype=image/png"] },
          { test: /\.ttf/, use: ["url-loader?mimetype=font/ttf"] }
        ]
      },

      // postcss: [autoprefixer({ browsers: ["last 2 version"] })]
    };
  },

  webpackEnvs() {
    return {
      development: {
        mode: 'development',
        devtool: "eval",
        entry: [
          `webpack-dev-server/client?http://0.0.0.0:${config.serverPort}`,
          "webpack/hot/only-dev-server",
          `./${config.paths.scripts}/app`
        ],

        plugins: [
        ]
      },

      distribute: {
        mode: 'production',
        entry: [
          `./${config.paths.scripts}/app`
        ],

        plugins: [
        ]
      }
    };
  }
};

config = _(config).mapObject(function(val) {
  if (_.isFunction(val)) { return val(); } else { return val; }
});

const webpackers = _(config.webpackEnvs).mapObject(val => webpack(deepExtend({}, config.webpack, val)));

//###################
//# TASKS
//###################

const copyAssets = () => {
  const assets = gulp
  .src(path.join(config.paths.assets, "**"))
  .pipe(gulp.dest(`${config.paths.tmp}/assets`));

  const instructions = gulp
    .src(path.join(config.paths.app, "index.html"))
    .pipe(gulp.dest(config.paths.tmp));

  return merge(assets, instructions);  
};

const copyPageFiles = () => gulp
  .src(path.join(config.paths.assets, "{instructions.html,page.png,result.html,beach.jpg}"))
  .pipe(gulp.dest(path.join(config.paths.dist, "assets")));

const webpackDevServer = (done) => {
  const server = new WebpackDevServer(webpackers.development, {
    contentBase: config.paths.tmp,
    hot: true,
    noInfo: true
  }
  );

  return server.listen(config.serverPort, "0.0.0.0", function(err) {
    if (err) { throw new $.util.PluginError("webpack-dev-server", err); }
    $.util.log($.util.colors.green(
      `[webpack-dev-server] Server running on http://localhost:${config.serverPort}`)
    );

    return done();
  });
};

const build = (done) => webpackers.distribute.run((err, stats) => {
  if (err) { 
    throw new $.util.PluginError("webpack:build", err); 
  }

  return done();
})

const serve = () => watch(["app/assets/**"], copyAssets);

const inline = () => gulp
  .src(`${config.paths.tmp}/index.html`)
  .pipe($.inlineSource())
  .pipe(rename({basename: "editor"}))
  .pipe(gulp.dest(`${config.paths.dist}`));

const dist = () => () => runSequence("copy-assets", "build", "inline", "copy-page-files");

exports.copyAssets = copyAssets;
exports.copyPageFiles = copyPageFiles;
exports.webpackDevServer = webpackDevServer;
exports.build = build;
exports.serve = series(copyAssets, webpackDevServer, serve);
exports.inline = inline;
exports.dist = series(copyAssets, build, inline, copyPageFiles);
exports.default = serve;
