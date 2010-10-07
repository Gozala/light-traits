'use strict'

var Trait = require('light-traits').Trait
,   utils = require('./utils')
,   Data = utils.Data
,   Method = utils.Method
,   Accessor = utils.Accessor
,   Required = utils.Required
,   Conflict = utils.Conflict

function method() {}

exports.Assert = require('./assert').Assert
exports['test simple composition'] = function(assert) {
  assert.sameTrait
  ( Trait
    ( Trait({ a: 0, b: 1 })
    , { c: { value: 2 }, d: { value: method } }
    )
  , { a: Data(0)
    , b: Data(1)
    , c: Data(2)
    , d: Method(method)
    }
  )
}

exports['test composition with conflict'] = function(assert) {
  assert.sameTrait
  (
    Trait
    ( Trait({ a: 0, b: 1 })
    , { a: { value: 2 }, c: { value: method } }
    )
  , { a: Conflict('a')
    , b: Data(1)
    , c: Method(method)
    }
  )
}

exports['test composition of identical props does not cause conflict'] = function(assert) {
  assert.sameTrait
  (
    Trait
    (
      Trait({ a: 0, b: 1 }),
      { a: { value: 0, writable: true, configurable: true, enumerable: true }
      , c: { value: method } 
      }
    ),
    { a: Data(0)
    , b: Data(1)
    , c: Method(method)
    }
  )
}

if (module == require.main) require('test').run(exports)
