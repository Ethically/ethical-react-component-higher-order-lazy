var fs = require('fs')
var transpile = require('ethical-utility-babel-directory-transpiler')
var config = JSON.parse(fs.readFileSync('./.babelrc', 'utf8'))

// alter config to keep ESM modules
config.presets[0][1].modules = false

transpile({ src: 'src/', dest: 'dist/esm', babelConfig: config })
