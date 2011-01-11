'use strict'

function equalDescriptors(actual, expected) {
  return (
  (   (actual.conflict && expected.conflict )
  ||  (actual.required && expected.required )
  ||  (   actual.get === expected.get
      &&  actual.set === expected.set
      &&  actual.value === expected.value
      &&  (true !== actual.enumerable) === (true !== expected.enumerable)
      &&  (true !== actual.required) === (true !== expected.required)
      &&  (true !== actual.conflict) === (true !== expected.conflict)
      )
  ))
}

function assertTraits(actual, expected) {
  var actualKeys = Object.getOwnPropertyNames(actual)
  ,   expectedKeys = Object.getOwnPropertyNames(expected)

  if (  actualKeys.length !== expectedKeys.length
    ||  expectedKeys.filter(function(key) {
          return 0 > actualKeys.indexOf(key)
        }).length
  ) return (
  { message: 'Traits have different properties'
  , actual: actualKeys.sort().join(',')
  , expected: expectedKeys.sort().join(',')
  })

  for (var i = 0, ii = expectedKeys.length; i < ii; i++) {
    var key = expectedKeys[i]
    if (!equalDescriptors(actual[key], expected[key])) return (
    { message: 'Property `' + key + '` is different'
    , actual: actual[key]
    , expected: expected[key]
    })
  }
}

var BaseAssert = require('test/assert').Assert
var AssertDescriptor =
{ equalTraits: { value: function equalTraits(actual, expected, message) {
    var result = assertTraits(actual, expected)
    if (result) {
      result.operator = 'equalTraits'
      this.fail(result)
    } else this.pass(message || 'Compared traits are equal')
  }}
}

exports.Assert = function Assert() {
  return Object.create
  ( BaseAssert.apply(null, arguments)
  , AssertDescriptor
  )
}

