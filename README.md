# grunt-dockertimes

> Persist file timestamps for Docker image builds.

This plugin will store the mtime timestamps and SHA1 hashes of your project
files into a cache file called .dockertimes.json. When the plugin is executed
again later, it will scan the cache file and restore the original mtime
timestamps of any files whose contents still match the original SHA1 hash.

The purpose of this operation is to ensure that Docker does not generate a new
image layer when you ADD unmodified files in your Dockerfile. Docker considers
both the file contents and the mtime timestamps when determining which files
have changed.

You should place the dockertimes operation at the end of your Grunt build task,
to ensure that all files are processed:

```js
grunt.initConfig({
  ...
  dockertimes: {
    files: 'dist/**'
  }
});
grunt.registerTask('build', ['build_into_dist...', '...', 'dockertimes']);
```

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-dockertimes --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-dockertimes');
```

## The "dockertimes" task

### Overview
In your project's Gruntfile, add a section named `dockertimes` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  dockertimes: {
    // Default target
    files: ['dist/**']
    your_target: {
      // Target-specific file lists and/or options go here.
      cwd: 'build',
      cache: 'build/.dockertimes.json'
      files: ['another_dir/**']
    },
  },
});
```

### Options

#### cwd
Type: `String`
Default value: `'.'`

The files paths will be expanded relative to this directory. Note however that
the cache file will _not_ be relative to this directory.

#### cache
Type: `String`
Default value: `'.dockertimes.json'`

The timestamp and SHA1 hash cache is stored in the specified file.

### Usage Examples

#### Default Options
In this example, the dist directory is processed with default options.

```js
grunt.initConfig({
  dockertimes: {
    files: 'dist/**'
  }
});

grunt.registerTask('build', ['all_build_operations...', '...', 'dockertimes']);
```

#### Custom Options
In this example, the dist directory is processed, relative to build, which is
used as the current directory. The cache file is stored in the build directory.

```js
grunt.initConfig({
  dockertimes: {
    cwd: 'build',
    cache: 'build/.dockertimes.json',
    files: 'dist/**'
  },
});

grunt.registerTask('build', ['all_build_operations...', '...', 'dockertimes']);
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

* 0.1.0 Initial version.
