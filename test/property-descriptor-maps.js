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
  assert.equalTraits
  ( Trait
    ( Trait({ a: 0, b: 1 })
    , { c: { value: 2 }, d: { value: method, enumerable: true } }
    )
  , { a: Data(0)
    , b: Data(1)
    , c: Data(2, false, false, false)
    , d: Method(method, true, false, true)
    }
  )
}

exports['test composition with conflict'] = function(assert) {
  assert.equalTraits
  (
    Trait
    ( Trait({ a: 0, b: 1 })
    , { a: { value: 2, writable: true, configurable: true, enumerable: true }
      , c: { value: method, configurable: true }
      }
    )
  , { a: Conflict('a')
    , b: Data(1)
    , c: Method(method, false, true, false)
    }
  )
}

exports['test composition of identical props does not cause conflict'] = function(assert) {
  assert.equalTraits
  (
    Trait
    ( { a: { value: 0, writable: true, configurable: true, enumerable: true }
      , b: { value: 1 }
      }
    , Trait({ a: 0, c: method })
    ),
    { a: Data(0)
    , b: Data(1, false, false, false)
    , c: Method(method)
    }
  )
}

if (module == require.main) require('test').run(exports)
