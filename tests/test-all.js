"use strict";

exports["test traits from objects"] = require("./traits");
exports["test traits from property descriptor maps"] = require("./descriptor");

// Disabling this check since it is not yet supported by jetpack.
//if (module == require.main)
  require('test').run(exports)
