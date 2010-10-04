'use strict'

var BaseAssert = require('test/assert').Assert
var AssertDescriptor =
{ sameTrait: { value: function sameTrait(actual, expected, message) {
    var actualNames = Object.getOwnPropertyNames(actual),
        expectedNames = Object.getOwnPropertyNames(expected)
    
    this.equal
    ( actualNames.length
    , expectedNames.length
    , 'equal traits must have same amount of properties'
    )
    actualNames.forEach(function(name) {
      if (0 > expectedNames.indexOf(name)) {
        this.fail(
        { actual: actualNames
        , expected: expectedNames
        , operator: 'equal traits must contain same named properties: ' + name
        , message: message
        })
      } else this.sameDescriptor(actual[name], expected[name], name)
    }, this)
  }}
, sameDescriptor: { value: function sameDescriptor(actual, expected, message) {
    message = message || ''
    if (actual.conflict || expected.conflict) {
      this.equal
      ( actual.conflict
      , expected.conflict
      , 'only one of descriptors has `conflict` property: ' + message
      )
    } else if (actual.required || expected.required) {
      this.equal
      ( actual.required
      , expected.required
      , 'only one of descriptors has `required` property: ' + message
      )
    } else {
      this.equal
      ( actual.get
      , expected.get
      , '`get` must be the same on both descriptors: ' + message
      )
      this.equal
      ( actual.set
      , expected.set
      , '`set` must be the same on both descriptors: ' + message
      )
      this.equal
      ( actual.value
      , expected.value
      , '`value` must be the same on both descriptors: ' + message
      )
      this.equal
      ( 'enumerable' in actual ? actual.enumerable : true
      , expected.enumerable
      , '`enumerable` must be the same on both descriptors: ' + message
      )
      this.equal
      ( 'value' in actual ? ('writable' in actual ? actual.writable : true) : actual.writable
      , expected.writable
      , '`writable` must be the same on both descriptors: ' + message
      )
      this.equal
      ( 'configurable' in actual ? actual.configurable : true
      , expected.configurable
      , '`configurable` must be the same on both descriptors: ' + message
      )
    }
  }}
}

exports.Assert = function Assert() {
  return Object.create
  ( BaseAssert.apply(null, arguments)
  , AssertDescriptor
  )
}

