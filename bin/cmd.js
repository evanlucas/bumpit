#!/usr/bin/env node

var nopt = require('nopt')
  , pkg = require('../package')
  , knownOpts = { loglevel: ['verbose', 'info', 'quiet']
                , bower: Boolean
                , git: Boolean
                , help: Boolean
                , version: Boolean
                , force: Boolean
                }
  , shortHand = { verbose: ['--loglevel', 'verbose']
                , quiet: ['--loglevel', 'quiet']
                , b: ['--bower']
                , g: ['--git']
                , v: ['--version']
                , h: ['--help']
                , H: ['--help']
                , f: ['--force']
                }
  , parsed = nopt(knownOpts, shortHand)
  , inq = require('inquirer')
  , help = require('help')()
  , bump = require('../lib')

if (parsed.help) {
  return help()
}

if (parsed.version) {
  return console.log('bumpit v'+pkg.version)
}

if (parsed.loglevel) bump.log.level = parsed.loglevel

var newVersion = parsed.argv.remain[0]

if (!bump.hasPackage()) {
  bump.log.error('package', 'missing package.json')
  process.exit(1)
}

var currentVersion = bump.getPackageVersion()

bump.log.info('package version', currentVersion)

var newVer = bump.valid(newVersion)

if (!newVer) {
  bump.log.error('invalid version', newVersion)
  return help(1)
}

if (newVer === currentVersion) {
  bump.log.error('invalid version', 'version not changed')
  return help(1)
}

if (parsed.force) {

  if (parsed.bower) bump.bower = true

  bump.log.info('new version', newVer)

  var package = bump.getPackage()
  package.version = newVer

  bump.writePkg(package)

  if (parsed.bower) {
    var bower = bump.getBower()
    bower.version = newVer
    bump.writeBower(bower)
  }

  if (parsed.git) {
    bump.tagGit(newVer, function(err) {
      if (err) {
        bump.log.error('git', 'error tagging git', err)
        return process.exit(1)
      }
      bump.log.info('git', 'tagged', newVer)
      process.exit()
    })
  }
} else {
  bump.log.info('new version', newVer)

  var package = bump.getPackage()
  package.version = newVer

  bump.writePkg(package)
  var q = []
  if (bump.hasBower()) {
    q.push({type: 'confirm', message: 'Include bower.json', name: 'bower'})
  }

  if (bump.hasGit()) {
    q.push({type: 'confirm', message: 'Include git tag', name: 'git'})
  }
  inq.prompt(q, function(a) {
    if (a.bower) {
      bump.bower = true
      var bower = bump.getBower()
      bower.version = newVer
      bump.writeBower(bower)
    }

    if (a.git) {
      bump.tagGit(newVer, function(err) {
        if (err) {
          bump.log.error('git', 'error tagging git', err)
          return process.exit(1)
        }
        bump.log.info('git', 'tagged', newVer)
        process.exit()
      })
    }
  })
}
