var Seq = require('seq');
var fs = require('fs');
var glob = require('glob');
var cp = require('child_process');
var EventEmitter = require('events').EventEmitter;
var colors = require('colors');

module.exports = aye;

//
// usage:
// require('aye')('node make.js', ['/tmp/*', '/var/**/*'], ['/tmp/some.json']);
//

function aye(command, includes, excludes) {
  var watching = [];

  // a wrapper around command
  var exec = function () {
    var t1 = Date.now();
    cp.exec(command, function (error, stdout, stderr) {
      var t2 = Date.now();
      if (error) {
        console.log('failed to exec: %s', command);
        if (error.msg) { console.log(error.msg); }
        if (stderr) { console.log(stderr); } 
        return;
      } 
      console.log(['success'.green, '(%s ms):'.grey, '%s\n'].join(' '), t2 - t1, command);
      if (stdout) { console.log(stdout); }
    });
  }

  // map globs to full paths
  Seq(includes)
    .parMap(function (inc) {
      var next = this;
      return glob(inc, function (err, files) {
        if (err) {
          return next(err);
        }
        return next(null, files);
      });
    })
    .flatten()
    .seq(function () {
      includes = this.stack;
      this();
    })
    // do excludes
    .set(excludes)
    .parMap(function (exc) {
      var next = this;
      return glob(exc, function (err, files) {
        if (err) {
          return next(err);
        }
        return next(null, files);
      });
    })
    .flatten()
    .seq(function () {
      excludes = this.stack;
      this();
    })
    .seq(function () {
      watching = includes.filter(function (inc) {
        return excludes.indexOf(inc) === -1;
      });
      console.log('watching:');
      watching.forEach(function (_path) {
        console.log(_path);
        var watcher = fs.watch(_path, { persistent: true }, function (event, filename) {
          exec.call(null);
        });
      });
      console.log();
    });
}