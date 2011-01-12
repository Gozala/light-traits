/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Irakli Gozalishvili <rfobic@gmail.com> (Original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
"use strict";

var owns = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

/**
 * Compares two trait custom property descriptors if they are the same. If
 * both are `conflict` or all the properties of descriptor are equal returned
 * value will be `true`, otherwise it will be `false`.
 * @param {Object} actual
 * @param {Object} expected
 */
function arePropertyDescriptorsEqual(actual, expected) {
  return (actual.conflict && expected.conflict ) ||
  (   actual.get === expected.get
  &&  actual.set === expected.set
  &&  actual.value === expected.value
  &&  (true !== actual.enumerable) === (true !== expected.enumerable)
  &&  (true !== actual.required) === (true !== expected.required)
  &&  (true !== actual.conflict) === (true !== expected.conflict)
  );
}

function throwConflictPropertyError(name) {
  throw new Error("Remaining conflicting property: `" + name + "`");
}
function throwRequiredPropertyError(name) {
  throw new Error("Missing required property: `" + name + "`");
}

/**
 * Generates custom **required** property descriptor. Descriptor contains
 * non-standard property `required` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function RequiredPropertyDescriptor(name) {
  var accessor = throwRequiredPropertyError.bind(null, name);
  return { get: accessor, set: accessor, required: true };
}
/**
 * Generates custom **conflicting** property descriptor. Descriptor contains
 * non-standard property `conflict` that is equal to `true`.
 * @param {String} name
 *    property name to generate descriptor for.
 * @returns {Object}
 *    custom property descriptor
 */
function ConflictPropertyDescriptor(name) {
  var accessor = throwConflictPropertyError.bind(null, name);
  return { get: accessor, set: accessor, conflict: true };
}

function isRequiredProperty(object, name) {
  return !!object[name].required;
}

function isConflictProperty(object, name) {
  return !!object[name].conflict;
}

function isBuildInMethod(name, source) {
  var target = Object.prototype[name];
  return target == source ||
         (String(target) === String(source) && target.name === source.name);
}

function overrideBuildInMethods(target, source) {
  if (isBuildInMethod('toString', target.toString)) {
    Object.defineProperty(target, 'toString',  {
      value: source.toString,
      configurable: true,
      enumerable: false
    });
  }
  if (isBuildInMethod('constructor', target.constructor)) {
    Object.defineProperty(target, 'constructor', {
      value: source.constructor,
      configurable: true,
      enumerable: false
    });
  }
}

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
function exclude(names, trait) {
  var composition = Object.create(Trait.prototype);
  Object.keys(trait).forEach(function(name) {
    // If property is not excluded (array of names does not contains it) or
    // it is a 'required' property coping it to resulting composition.
    if (0 > names.indexOf(name) || isRequiredProperty(trait, name))
      composition[name] = trait[name];
    // For all the names in the exclude name array we create required
    // property descriptors and copy them to the resulting composition.
    else
      composition[name] = RequiredPropertyDescriptor(name);
  });
  return composition;
}

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
function rename(renames, trait) {
  var composition = Object.create(Trait.prototype);
  Object.keys(trait).forEach(function(name) {
    var alias;
    // Must be renamed & it's not a required property.
    if (owns(renames, name) && !isRequiredProperty(trait, name)) {
      alias = renames[name];
      // If 2+ properties are renamed to the same alias conflict is created.
      if (owns(composition, alias) && !isRequiredProperty(composition, alias))
        composition[alias] = ConflictPropertyDescriptor(alias);
      // Add the property under an alias.
      else
        composition[alias] = trait[name];
      // Add a required property under the original name but only if a property
      // under the original name does not exist such a property could exist if
      // an earlier property in the trait was previously aliased to this name.
      if (!owns(composition, name))
        composition[name] = RequiredPropertyDescriptor(name);
    }
    else { 
      // Must not be renamed or it's a required property that does not exists
      // in resulting composition.
      if (!owns(composition, name))
        composition[name] = trait[name]
      // Property exists in resulting composition & it's not requirement.
      else if (!isRequiredProperty(trait, name))
        composition[name] = ConflictPropertyDescriptor(name);
    }
  });
  return composition;
}

function resolve(resolutions, trait) {
    var renames = {};
    var exclusions = [];
    // pre-process renamed and excluded properties
    Object.keys(resolutions).forEach(function(name) {
      // old name -> new name
      if (resolutions[name]) renames[name] = resolutions[name];
      // name -> undefined
      else exclusions.push(name);
    });
    return rename(renames, exclude(exclusions, trait));
}

/**
 * Function composes "custom" properties descriptor map that inherits from
 * `Trait.prototype` and contains property descriptors for all the own
 * properties of the given argument (inherited properties are ignored).
 *
 * Data properties bound to the `Trait.required` singleton exported by
 * this module will be marked as 'required' properties.
 *
 * @param {Object} object
 *    Set of properties to compose trait from.
 * @returns {Trait}
 *    Trait / Property descriptor map containing all the own properties of the
 *    given argument.
 */
function trait(object) {
  var composition;
  if (!(object instanceof Trait)) {
    // If passed `object` is not already an instance of `Trait` we create
    // one that will be a result of this composition and target to which all
    // property descriptors will be copied.
    composition = Object.create(Trait.prototype);
    // For each property we copy it's descriptor map to resulting composition
    // unless property defines 'requirement' of a property, in which case we
    // create & copy property descriptor for a property requirement.
    Object.keys(object).forEach(function (name) {
      if (Trait.required == Object.getOwnPropertyDescriptor(object, name).value)
        composition[name] = RequiredPropertyDescriptor(name);
      else
        composition[name] = Object.getOwnPropertyDescriptor(object, name);
    });
  }
  // If passed object is an instance of `Trait` then we make it result of the
  // composition since.
  else {
    composition = object;
  }
  return composition;
}
/**
 * Function composes "custom" properties descriptor map that inherits from
 * `Trait.prototype` and contains property descriptors for all the own
 * properties of the passed traits.
 *
 * If two or more traits have own properties with the same name, returned
 * trait will contain a 'conflict' property for that name. 'compose' is
 * a commutative and associative operation, and the order of its
 * arguments is irrelevant.
 */
function compose(trait1, trait2/*, ...*/) {
  // Creating new instance of `Trait` that will be result of this
  // composition and target to which all properties will be copied.
  var composition = Object.create(Trait.prototype);
  // Properties of each passed trait are copied to the resulting trait.
  Array.prototype.forEach.call(arguments, function(trait) {
    // Coping each property of the given trait.
    Object.keys(trait).forEach(function(name) {
      // If composition already owns a property with the `name` that is
      // not a requirement (that is will be satisfied)
      if (owns(composition, name) && !isRequiredProperty(composition, name)) {
        // and if property being copied is neither requirement (that is already
        // satisfied) nor an equal property, conflict property is created.
        if (!isRequiredProperty(trait, name) &&
            !arePropertyDescriptorsEqual(composition[name], trait[name])
        ) composition[name] = ConflictPropertyDescriptor(name);
      }
      // If composition does not owns a property with the `name` that is not
      // a requirement (that will be resolved) property from the source trait
      // is copied.
      else {
        composition[name] = trait[name];
      }
    });
  });
  return composition;
}

function defineProperties(object, properties) {
  var verifiedProperties = {};
  // Coping each property to a map since we want to throw (if will be
  // necessary) before defining any property.
  Object.keys(properties).forEach(function(name) {
    // If property that is being defined is a "required" property.
    if (isRequiredProperty(properties, name)) {
      // and it is not satisfied by an object itself (does not has same named
      // property) exception is thrown.
      if (!(name in object)) throwRequiredPropertyError(name);
    }
    // If property that is being defined is a "conflict" property exception
    // is thrown.
    else if (isConflictProperty(properties, name)) {
      throwConflictPropertyError(name);
    }
    // If property is neither "required" nor "conflict" copying it a map of
    // verified properties.
    else {
      verifiedProperties[name] = properties[name];
    }
  });
  return Object.defineProperties(object, verifiedProperties);
}

function create(prototype, properties) {
  // Creating instance of the given prototype.
  var object = Object.create(prototype);
  // Overriding build-in (`toString`, `constructor`) methods if they were
  // inherited from `Object.prototype`.
  overrideBuildInMethods(object, Trait.prototype);
  // Defines all the given properties.
  return defineProperties(object, properties);
}

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
function Trait(trait1, trait2) {
  // If this function is called with only one argument then it's an object
  // and trait must be created out of the map of it's property descriptors.
  // Otherwise arguments are treated as traits / property descriptor maps.
  return undefined === trait2 ? trait(trait1) : compose.apply(null, arguments)
}
Object.freeze(Object.defineProperties(Trait.prototype, {
  toString: { value: function toString() {
    return '[object ' + this.constructor.name + ']'
  }},
  /**
   * `create` is like `Object.create`, except that it ensures that:
   *    - an exception is thrown if 'trait' still contains required properties
   *    - an exception is thrown if 'trait' still contains conflicting
   *      properties
   * @param {Object}
   *    prototype of the compared object
   * @param {Object} trait
   *    trait object to be turned into a compare object
   * @returns {Object}
   *    An object with all of the properties described by the trait.
   */
  create: { value: function createTrait(prototype) {
    return create(undefined === prototype ? Object.prototype : prototype, this)
  }, enumerable: true },
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
  resolve: { value: function resolveTrait(resolutions) {
    return resolve(resolutions, this);
  }, enumerable: true }
}));

/**
 * @see compose
 */
Trait.compose = Object.freeze(compose);
Object.freeze(compose.prototype);

/**
 * Constant singleton, representing placeholder for required properties.
 * @type {Object}
 */
Trait.required = Object.freeze(Object.create(Object.prototype, {
  toString: { value: Object.freeze(function toString() {
    return '<Trait.required>';
  })}
}));
Object.freeze(Trait.required.toString.prototype);

exports.Trait = Object.freeze(Trait);
