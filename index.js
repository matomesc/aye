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
  var watching = [],
      _busy = false;;

  includes = (typeof includes === 'string') ? [includes] : includes || [];
  excludes = (typeof excludes === 'string') ? [excludes] : excludes || [];

  // a wrapper around command
  var exec = function (callback) {
    var t1 = Date.now();
    cp.exec(command, function (error, stdout, stderr) {
      var t2 = Date.now();
      if (error) {
        console.log('failed to exec: %s', command);
        if (error.msg) { console.log(error.msg); }
        if (stderr) { console.log(stderr); } 
        return callback(error);
      }
      console.log(['success'.green, '(%s ms):'.grey, '%s\n'].join(' '), t2 - t1, command);
      if (stdout) { console.log(stdout); }
      return callback(null);
    });
  }

  // map globs to full paths
  Seq(includes)
    .parMap(function (inc) {
      var next = this;
      return glob(inc, function (err, files) {
        return err ? next(err) : next(null, files);
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
        return err ? next(err) : next(null, files);
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
          if (_busy) {
            return;
          }
          _busy = true;
          exec.call({}, function (err) {
            _busy = false;
          });
        });
      });
      console.log();
    });
}