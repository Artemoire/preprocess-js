var { cfg, preprocess } = require('../src/preprocess');
var map = require("map-stream");

module.exports = function (options) {
  var ctx = cfg(options);

  function ppStream(file, callback) {
    var contents, extension;

    if (file.isNull()) return callback(null, file); // pass along
    if (file.isStream())
      return callback(new Error("artemoire-preprocess: Streaming not supported"));

    contents = file.contents.toString("utf8");
    contents = preprocess(contents, ctx);
    file.contents = Buffer.from(contents);

    callback(null, file);
  }

  return map(ppStream);
};