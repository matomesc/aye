[![build status](https://secure.travis-ci.org/matomesc/aye.png)](http://travis-ci.org/matomesc/aye)
# aye

> aye watches files for you and execs commands when they change

## example

```javascript
var aye = require('aye');
aye('jshint lib/**', ['lib/**']);
```

## install

```
$ npm install aye
```

## usage

### aye(command, includes, excludes)

The includes and excludes are expanded and the differences is watched. Upon a change, `command` is exec'd.