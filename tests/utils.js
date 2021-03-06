/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

(typeof define === "undefined" ? function ($) { $(require, exports, module); } : define)(function (require, exports, module, undefined) {

"use strict";

var ERR_CONFLICT = "Remaining conflicting property: ";
var ERR_REQUIRED = "Missing required property: ";

exports.Data = function Data(value, enumerable, configurable, writable) {
  return ({
    value: value,
    enumerable: enumerable !== false,
    configurable: configurable !== false,
    writable: writable !== false
  });
};

exports.Method = function Method(method, enumerable, configurable, writable) {
  return ({
    value: method,
    enumerable: enumerable !== false,
    configurable: configurable !== false,
    writable: writable !== false
  });
};

exports.Accessor = function Accessor(get, set, enumerable, configurable) {
  return ({
    get: get,
    set: set,
    enumerable: enumerable !== false,
    configurable: configurable !== false
  });
};

exports.Required = function Required(name) {
  function required() { throw new Error(ERR_REQUIRED + name) }

  return ({
    get: required,
    set: required,
    required: true
  });
};

exports.Conflict = function Conflict(name) {
  function conflict() { throw new Error(ERR_CONFLICT + name) }

  return ({
    get: conflict,
    set: conflict,
    conflict: true
  });
};

});
