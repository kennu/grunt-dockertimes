'use strict';

var grunt = require('grunt');
var fs = require('fs');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.dockertimes = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  default_options: function(test) {
    test.expect(5);

    var dockertimes = grunt.file.read('.dockertimes.json');
    var fixturetimes = grunt.file.read('test/fixtures/dockertimes.json');
    test.equal(dockertimes, fixturetimes, 'should use test .dockertimes.json');
    var cache = JSON.parse(dockertimes);
    var item = cache['tmp/dist/test/fixtures/testfile.txt'];
    test.ok(item, 'should have item in cache');
    test.equal(item.sha1, '6681fa487fc6adfe5cf0ebf7f9893d74b13d6c78', 'should have test hash');
    test.equal(item.mtime, 1417469686000, 'should have test timestamp');
    // Check that the real file was synced to this mtime
    fs.stat('tmp/dist/test/fixtures/testfile.txt', function(err, stat) {
      test.equal(stat.mtime.getTime(), item.mtime, 'should have synched file mtime from .dockertimes.json');
      test.done();
    });
  },
  custom_options: function(test) {
    test.expect(3);

    var dockertimes = grunt.file.read('tmp/subtest/.dockertimes');
    test.notEqual(dockertimes.length, 0, 'should create .dockertimes');
    var cache = JSON.parse(dockertimes);
    var item = cache['tmp/subtest/dist/test/fixtures/testfile.txt'];
    test.ok(item, 'should have item in cache');
    // Check that the real file's mtime was recorded in .dockertimes
    fs.stat('tmp/subtest/dist/test/fixtures/testfile.txt', function(err, stat) {
      test.equal(stat.mtime.getTime(), item.mtime, 'should have stored mtime from file in .dockertimes');
      test.done();
    });
  },
};
