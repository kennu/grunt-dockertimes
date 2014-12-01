/*
 * grunt-dockertimes
 * https://github.com/kennu/grunt-dockertimes
 *
 * Copyright (c) 2014 Kenneth Falck
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var whenjs = require('when');
var nodefn = require('when/node');

// Lift some promise functions
var lstat = nodefn.lift(fs.lstat);
var utimes = nodefn.lift(fs.utimes);
var readFile = nodefn.lift(fs.readFile);

module.exports = function(grunt) {

  function restoreFileTime(file, fileCache, stat) {
    return utimes(file, stat.atime, new Date(fileCache[file].mtime)).then(function() {
      grunt.log.ok('Restored', (stat.isFile() ? 'file' : 'path'), file, 'to mtime', fileCache[file].mtime);
    });
  }

  // Check file hash when the mtime is known to have been modified
  function checkFileHash(file, fileCache, stat, mtime) {
    // Retrieve the file's current SHA1 hash
    return readFile(file).then(function(data) {
      var sha1 = crypto.createHash('sha1').update(data).digest('hex');
      if (sha1 === fileCache[file].sha1) {
        // Hash is identical so we can restore the cached file mtime
        return restoreFileTime(file, fileCache, stat);
      } else {
        // Has has changed, so we will store the new hash and new mtime in the cache
        grunt.log.ok('Cached modified file', file, 'with sha1', sha1, 'and mtime', mtime);
        fileCache[file] = {mtime:mtime, sha1:sha1};
      }
    });
  }

  // Check if the file mtime has been modified from the cached version
  function checkFileTime(file, fileCache) {
    // Retrieve the file's current mtime
    return lstat(file).then(function(stat) {
      // Check if the file's mtime is different than in cache
      var mtime = stat.mtime.getTime();
      if (fileCache[file] !== undefined && fileCache[file].mtime && fileCache[file].mtime !== mtime) {
        // The mtime exists in cache and is different than in the file; check if the SHA1 hash has changed too
        if (stat.isFile()) {
          return checkFileHash(file, fileCache, stat, mtime);
        } else {
          // For non-files, skip the hash and just restore the mtime
          restoreFileTime(file, fileCache, stat);
        }
      } else if (fileCache[file] === undefined) {
        // Missing mtime in cache; store it there along with the hash
        if (stat.isFile()) {
          return readFile(file).then(function(data) {
            var sha1 = crypto.createHash('sha1').update(data).digest('hex');
            fileCache[file] = {mtime:mtime, sha1:sha1};
            grunt.log.ok('Cached new file', file, 'with sha1', sha1, 'and mtime', mtime);
          });
        } else {
          // For non-files, skip the hash
          fileCache[file] = {mtime:mtime};
          grunt.log.ok('Cached new path', file, 'with mtime', mtime);
        }
      } else {
        // Identical mtime; don't do anything
        grunt.log.debug('Unmodified timestamp for', file);
      }
    });
  }

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('dockertimes', 'Persist file timestamps for Docker image building', function(targetName) {
    // Initialize async task
    var done = this.async();

    // Get task configuration (default or specified targetName)
    grunt.task.current.requiresConfig(this.name);
    var target = grunt.config(this.name);
    if (targetName) target = target[targetName];

    // Set some defaults
    var expandOptions = {
      nonull: true
    };
    var cacheFilename = target.cache || '.dockertimes.json';
    if (target.cwd) {
      expandOptions.cwd = target.cwd;
    }

    // Read previously saved cache JSON if present
    fs.readFile(cacheFilename, {encoding:'utf8'}, function(err, data) {
      var fileCache = {};
      if (data) {
        try {
          fileCache = JSON.parse(data);
        } catch (err) {
          fileCache = {};
        }
      }

      // Get the target files and expand them to support /**
      var fileTargets = (target||{}).files || [];
      var promises = fileTargets.map(function(fileTarget) {
        var files = grunt.file.expand(expandOptions, fileTarget);
        return files.map(function(file) {
          if (target.cwd) {
            file = path.join(target.cwd, file);
          }
          // Process a single file; resolve or reject the promise when ready
          return checkFileTime(file, fileCache);
        })
      }).reduce(function(files, fileset) { return files.concat(fileset); });

      // Wait for all promises to resolve; we have processed all files when they do
      whenjs.all(promises).then(function() {
        // Write out updated cache JSON
        fs.writeFile(cacheFilename, JSON.stringify(fileCache), {encoding:'utf8'}, function(err) {
          if (err) {
            // Warn of error but don't die
            grunt.fail.warn(err);
          }
          done();
        });
      }).then(null, function(err) {
        // Something went wrong while getting file mtimes
        grunt.fail.fatal(err);
        done();
      });
    });
  });
};
