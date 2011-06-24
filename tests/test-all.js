/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

!(typeof define === "undefined" ? function ($) { $(require, exports, module); } : define)(function (require, exports, module, undefined) {

"use strict";

exports["test traits from objects"] = require("./object-tests");
exports["test traits from descriptors"] = require("./descriptor-tests");
exports["test inheritance"] = require("./inheritance-tests");

if (module == require.main)
  require('test').run(exports);

});
