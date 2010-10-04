'use strict'
// Design inspired by: http://www.traitsjs.org/

// shortcuts
var getOwnPropertyNames = Object.getOwnPropertyNames
,   getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
,   hasOwn = Object.prototype.hasOwnProperty
,   _create = Object.create
,   _freeze = Object.freeze
// constants
,   ERR_CONFLICT = 'Remaining conflicting property: '
,   ERR_REQUIRED = 'Missing required property: '

/**
 * Compares two trait custom property descriptors if they are the same. If
 * both are `conflict` or all the properties of descriptor are equal returned
 * value will be `true`, otherwise it will be `false`.
 * @param {Object} desc1
 * @param {Object} desc2
 */
function areSame(desc1, desc2) {
  return (desc1.conflict && desc2.conflict) || (
    desc1.get === desc2.get &&
    desc1.set === desc2.set &&
    desc1.value === desc2.value &&
    desc1.enumerable === desc2.enumerable &&
    desc1.required === desc2.required &&
    desc1.conflict === desc2.conflict
  )
}
/**
 * Converts array to an object whose own property names represent
 * values of array.
 * @param {String[]} names
 * @returns {Object}
 * @example
 *  Map(['foo', ...]) => { foo: true, ...}
 */
function Map(names) {
  var map = {}
  names.forEach(function(name) { map[name] = true })
  return map
}
/**
 * Constant singleton, representing placeholder for required properties.
 * @type {Object}
 */
var required = { toString: function() { '<Trait.required>' } }
exports.required = Trait.required = required
/**
 * Generates custom **required** property descriptor. Descriptor contains
 * non-standard property `required` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function Required(name) {
  function required() { throw new Error(ERR_REQUIRED + name) }
  return (
  { get: required
  , set: required
  , required: true
  })
}
/**
 * Generates custom **conflicting** property descriptor. Descriptor contains
 * non-standard property `conflict` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function Conflict(name) {
  function conflict() { throw new Error(ERR_CONFLICT + name) }
  return (
  { get: conflict
  , set: conflict
  , conflict: true
  })
}

/**
 * Function generates custom properties descriptor of the `object`s own
 * properties. All the inherited properties are going to be ignored.
 * Properties with values matching `required` singleton will be marked as
 * 'required' properties.
 * @param {Object} object
 *    Set of properties to generate trait from.
 * @returns {Object}
 *    Properties descriptor of all of the `object`'s own properties.
 */
function _Trait(properties) {
  if (properties instanceof Trait) return properties
  var trait = Object.create(Trait.prototype)
  ,   keys = getOwnPropertyNames(properties)
  keys.forEach(function(key) {
    var descriptor = getOwnPropertyDescriptor(properties, key)
    trait[key] = (required === descriptor.value) ? Required(key) : descriptor
  })
  return trait
}
function Trait() {
  var result = Object.create(Trait.prototype)
  Array.prototype.map.call(arguments, _Trait).forEach(function(trait) {
    getOwnPropertyNames(trait).forEach(function(key) {
      var descriptor = trait[key]
      // if property already exists and it's not a requirement
      if (hasOwn.call(result, key) && !result[key].required) {
        if (descriptor.required)
          continue
        if (!areSame(descriptor, result[key]))
          result[key] = Conflict(key)
      } else {
        result[key] = descriptor
      }
    })
  })
  return result
}
Trait.prototype.toString = function toString() {
  return '[object ' + this.constructor.name + ']'
}
Trait.prototype.create = function create(proto) {
  return Trait.create(undefined == proto ? {} : proto, this)
}
Trait.prototype.resolve = function resolve(resolutions) {
  return Trait.resolve(resolutions, this);
}
exports.Trait = Trait

/**
 * Composes new trait. If two or more traits have own properties with the
 * same name, the new trait will contain a 'conflict' property for that name.
 * 'compose' is a commutative and associative operation, and the order of its
 * arguments is not significant.
 *
 * @params {Object} trait
 *    Takes traits as an arguments
 * @returns {Object}
 *    New trait containing the combined own properties of all the traits.
 * @example
 *    var newTrait = compose(trait_1, trait_2, ..., trait_N)
 */
function compose(trait1, trait2) {
  var traits = Array.prototype.slice.call(arguments, 0).map(_Trait),
      result = Object.create(Trait.prototype)
  traits.forEach(function(trait) {
    var keys = getOwnPropertyNames(trait)
    keys.forEach(function(key) {
      var descriptor = trait[key]
      // if property already exists and it's not a requirement
      if (hasOwn.call(result, key) && !result[key].required) {
        if (descriptor.required)
          continue
        if (!areSame(descriptor, result[key]))
          result[key] = Conflict(key)
      } else {
        result[key] = descriptor
      }
    })
  })
  return result
}
exports.compose = exports.trait = Trait.compose = compose
/**
 * Composes new trait with the same own properties as the original trait,
 * except that all property names appearing in the first argument are replaced
 * by 'required' property descriptors.
 * @param {String[]} keys
 *    Array of strings property names.
 * @param {Object} trait
 *    A trait some properties of which should be excluded.
 * @returns {Object}
 * @example
 *    var newTrait = exclude(['name', ...], trait)
 */
function exclude(keys, trait) {
  var exclusions = Map(keys)
  ,   result = {}
  ,   keys = getOwnPropertyNames(trait)
  keys.forEach(function(key) {
    if (!hasOwn.call(exclusions, key) || trait[key].required)
      result[key] = trait[key]
    else
      result[key] = Required(key)
  })
  return result
}

/**
 * Composes a new trait with all of the combined properties of the argument
 * traits. In contrast to `compose`, `override` immediately resolves all
 * conflicts resulting from this composition by overriding the properties of
 * later traits. Trait priority is from left to right. I.e. the properties of
 * the leftmost trait are never overridden.
 * @params {Object} trait
 * @returns {Object}
 * @examples
 *    // override is associative:
 *    override(t1,t2,t3)
 *    // is equivalent to
 *    override(t1, override(t2, t3))
 *    // or
 *    to override(override(t1, t2), t3)
 *
 *    // override is not commutative:
 *    override(t1,t2)
 *    // is not equivalent to
 *    override(t2,t1)
 */
function override() {
  var traits = Array.prototype.slice.call(arguments, 0).map(_Trait),
      result = Object.create(Trait.prototype)
  traits.forEach(function(trait) {
    var keys = getOwnPropertyNames(trait)
    keys.forEach(function(key) {
      var descriptor = trait[key]
      if (!hasOwn.call(result, key) || result[key].required)
        result[key] = descriptor
    })
  })
  return result
}
exports.override = Trait.override = override
/**
 * Composes a new trait with the same properties as the original trait, except
 * that all properties whose name is an own property of map will be renamed to
 * map[name], and a 'required' property for name will be added instead.
 * @param {Object} map
 *    An object whose own properties serve as a mapping from old names to new
 *    names.
 * @param {Object} trait
 *    A trait object
 * @returns {Object}
 * @example
 *    var newTrait = rename(map, trait)
 */
function rename(map, trait) {
  var result = Object.create(Trait.prototype, {}),
      keys = getOwnPropertyNames(trait)
  keys.forEach(function(key) {
    // must be renamed & it's not requirement
    if (hasOwn.call(map, key) && !trait[key].required) {
      var alias = map[key]
      if (hasOwn.call(result, alias) && !result[alias].required)
        result[alias] = Conflict(alias)
      else
        result[alias] = trait[key]
      if (!hasOwn.call(result, key))
        result[key] = Required(key)
    } else { // must not be renamed or its a requirement
      // property is not in result trait yet
      if (!hasOwn.call(result, key))
        result[key] = trait[key]
      // property is already in resulted trait & it's not requirement
      else if (!trait[key].required)
        result[key] = Conflict(key)
    }
  })
  return result
}
/**
* Composes new resolved trait, with all the same properties as the original
* trait, except that all properties whose name is an own property of
* resolutions will be renamed to `resolutions[name]`. If it is
* `resolutions[name]` is `null` value is changed into a required property
* descriptor.
* function can be implemented as `rename(map,exclude(exclusions, trait))`
* where map is the subset of mappings from oldName to newName and exclusions
* is an array of all the keys that map to `null`.
* Note: it's important to **first** `exclude`, **then** `rename`, since
* `exclude` and rename are not associative.
* @param {Object} resolutions
*   An object whose own properties serve as a mapping from old names to new
*   names, or to `null` if the property should be excluded.
* @param {Object} trait
*   A trait object
* @returns {Object}
*   Resolved trait with the same own properties as the original trait.
*/
function resolve(resolutions, trait) {
  var renames = {},
      exclusions = [],
      keys = getOwnPropertyNames(resolutions)
  keys.forEach(function(key) {  // pre-process renamed and excluded properties
    if (resolutions[key])       // old name -> new name
      renames[key] = resolutions[key]
    else                        // name -> undefined
      exclusions.push(key)
  })
  return rename(renames, exclude(exclusions, _Trait(trait)))
}
exports.resolve = Trait.resolve = resolve
/**
 * `create` is like `Object.create`, except that it ensures that:
 *    - an exception is thrown if 'trait' still contains required properties
 *    - an exception is thrown if 'trait' still contains conflicting
 *      properties
 * @param {Object}
 *    prototype of the compvared object
 * @param {Object} trait
 *    trait object to be turned into a compvare object
 * @returns {Object}
 *    An object with all of the properties described by the trait.
 */
function create(proto, trait) {
  var properties = {}
  ,   keys = getOwnPropertyNames(trait)
  if (proto) {
    if ('' + proto.toString == '' + Object.prototype.toString) {
      Object.defineProperty(proto, 'toString',  {
        value: Trait.prototype.toString
      })
    }
    if ('' + proto.constructor == '' + Object) {
      Object.defineProperty(proto, 'constructor', {
        value: Trait.prototype.constructor
      })
    }
  }
  keys.forEach(function(key) {
    var descriptor = trait[key]
    if (descriptor.required) {
      if (hasOwn.call(proto, key))
        continue
      else
        throw new Error(ERR_REQUIRED + key)
    }
    else if (descriptor.conflict) {
      throw new Error(ERR_CONFLICT + key)
    }
    else {
      properties[key] = descriptor
    }
  })
  return _create(proto, properties)
}
exports.create = Trait.create = create

