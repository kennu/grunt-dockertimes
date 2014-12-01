/*
 * grunt-dockertimes
 * https://github.com/kennu/grunt-dockertimes
 *
 * Copyright (c) 2014 Kenneth Falck
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['.dockertimes.json', 'tmp']
    },

    // Before testing, copy some test files in place
    copy: {
      test: {
        files: [
          {expand:true, src:['test/fixtures/testfile.txt'], dest: 'tmp/dist'},
          {expand:false, src:['test/fixtures/dockertimes.json'], dest: '.dockertimes.json'},
          {expand:true, src:['test/fixtures/testfile.txt'], dest: 'tmp/subtest/dist'}
        ]
      }
    },

    // Configuration to be run (and then tested).
    dockertimes: {
      files: ['tmp/dist/**'],
      custom_options: {
        cache: 'tmp/subtest/.dockertimes',
        cwd: 'tmp/subtest',
        files: ['dist/**']
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'copy:test', 'dockertimes', 'dockertimes:custom_options', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
