var log = require('npmlog')
  , fs = require('fs')
  , path = require('path')
  , semver = require('semver')
  , exec = require('child_process').execFile
  , chain = require('slide').chain
  , cwd = process.cwd()
  , bump = exports

log.heading = 'bumpit'

bump.log = log

var pkgPath = path.join(cwd, 'package.json')
var bowerPath = path.join(cwd, 'bower.json')
var gitPath = path.join(cwd, '.git')

// This is ugly and needs to be re-written

bump.hasPackage = function() {
  return fs.existsSync(pkgPath)
}

bump.hasBower = function() {
  return fs.existsSync(bowerPath)
}

bump.bower = false

bump.hasGit = function() {
  return fs.existsSync(gitPath)
}

bump.getPackageVersion = function() {
  return require(pkgPath).version
}

bump.getPackage = function(cb) {
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
}

bump.getBowerVersion = function() {
  return require(bowerPath).version
}

bump.getBower = function(cb) {
  return JSON.parse(fs.readFileSync(bowerPath, 'utf8'))
}

bump.valid = function(version) {
  var newver = semver.valid(version)
  if (!newver) newver = semver.inc(bump.getPackageVersion(), version)
  return newver
}

bump.tagGit = function(version, cb) {
  bump.log.verbose('git', 'tag', version)
  var env = '/usr/bin/env'
  var v = version
  var bower = bump.hasBower() && bump.bower
  chain
    ( [ [ exec, env, ['git', 'add', 'package.json'], { env: process.env } ]
      , bower && [ exec, env, ['git', 'add', 'bower.json'], { env: process.env } ]
      , [ exec, env, ['git', 'commit', '-m', v], {env: process.env } ]
      , [ exec, env, ['git', 'tag', 'v'+v, '-am', v ]
        , { env: process.env } ] ]
    , cb )
}

bump.writePkg = function(data) {
  bump.log.verbose('write', 'package.json', data.version)
  fs.writeFileSync( pkgPath
                  , JSON.stringify(data, null, 2) + '\n'
                  , 'utf8'
                  )
}

bump.writeBower = function(data) {
  bump.log.verbose('write', 'bower.json', data.version)
  fs.writeFileSync( bowerPath
                  , JSON.stringify(data, null, 2) + '\n'
                  , 'utf8'
                  )
}
