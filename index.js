'use strict';

var Util = require('gulp-util');
var Transform = require('readable-stream/transform');
var VinylBufferStream = require('vinyl-bufferstream');
var Path = require('path');
var CleanCSS = require('clean-css');

var REP = '__{#}__';

function splitExports(contents){
  var regStart = /(\/\*\*[\w\W\r\n]*?@export\s*(.*)[\r\n]*[\w\W\r\n]*?\*\/)/i;
  var regRepAll = /(\/\*\*[\w\W\r\n]*?@export\s*(.*)[\r\n]*[\w\W\r\n]*?\*\/)/ig;

  function getChildId(child){
    var m = child.match(regStart);
    return m ? m[2] : false;
  }

  var output = [];
  if(!regStart.test(contents)){
    // 如果没有分块，则按整体暴露
    return contents;
  }else{
    var input = contents.replace(regRepAll, '|###|$1').split('|###|').slice(1);
    input.forEach(function(item){
      var childId = getChildId(item);
      if(!childId) return;
      output.push({key: childId, value: item});
    });
    return output;
  }
}

function minify(cleanCssOption, contents){
  var text = new CleanCSS(cleanCssOption).minify(contents).styles;
  //包装成module
  var text = text.replace(/[']/g, "\\'");
  text = '<style type="text/css">' + text + '</style>';
  return text;
}

module.exports = function (options){
  options = options || {};

  return new Transform({
    objectMode: true,
    transform: function (file, enc, cb) {
      var run = new VinylBufferStream(function(buf, done) {
        var text = buf.toString();

        var cleanCssOption = options.cleanCss || {};
        cleanCssOption.target = file.path;

        var blocks = splitExports(text);
        if(typeof blocks === 'string'){
          text = minify(cleanCssOption, text);
          text = "  module.exports = '" + text + "';";
        }else{
          var output = [];
          blocks.forEach(function(item){
            output.push('  exports.' + item.key + " = '" + minify(cleanCssOption, item.value) + "';");
          });
          text = output.join('\r\n');
        }

        var moduleId = file.path.replace(file.base, '').replace(Path.extname(file.path), '').replace(Path.sep, '/' + (options.prefix || ''));
        var tpl = "define('" + moduleId + "', function(require, exports, module){\r\n" +
            REP +
            "\r\n});";
        text = tpl.replace(REP, text);

        done(null, new Buffer(text));
      });

      var self = this;

      run(file, function(err, contents) {
        if (err) {
          self.emit('error', new Util.PluginError('gulp-seajs-css', err, {fileName: file.path}));
        } else {
          file.contents = contents;
          file.path = Util.replaceExtension(file.path, '.js');
          self.push(file);
        }
        cb();
      });
    }
  });
};
