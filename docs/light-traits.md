# light-traits #

## Traits ##

[Traits] are a simple composition mechanism for structuring object-oriented
programs that represent reusable building blocks, with a goal to factor out
a common piece of functionality that can be reused by multiple abstractions,
regardless of their inheritance chain _(prototype chain to be more precise)_.

It is also can be described as a more robust alternative to [mixins] & [multiple
inheritance]. More robust because name clashes must be resolved explicitly by
composer where composition is commutative & associative (order of traits in
composition is irrelevant).

## Ecmascript 5 ##

Library is designed to work with the new object manipulation APIs defined in
[Ecmascript-262, Edition 5]. Constructed traits actually do represent property
descriptor maps that inherit from `Trait.prototype` to expose methods described
in details in following sections.

## Trait construction ##

Module exports trait constructor function `Trait` that takes javascript object
literal as an argument and produces trait providing own properties of an object
used to construct it.

    var Trait = require('light-traits').Trait;
    var TBar = Trait({
      foo: 'foo',
      bar: function bar() {
        return 'Hi Bar!'
      },
      baz: Trait.required
    })

Example above composes a trait `TBar` (by convention we prefix traits with a
capital "T"), that defines property `foo` with value `"foo"` and property `bar`
with a value of `bar` function. Here is a representation of `TBar`.

    // TBar
    { foo: {
        value: 'foo',
        enumerable: true,
        configurable: true,
        writable: true
      },
      bar: {
        value: function b() {
          return 'bar'
        },
        enumerable: true,
        configurable: true,
        writable: true
      },
      baz: {
        get baz() { throw new Error('Missing required property: `baz`') }
        set baz() { throw new Error('Missing required property: `baz`') }
      },
      __proto__: Trait.prototype
    }

So trait is just a plain object literal that is an ES5 property descriptor map.
Also notice that `__proto__` property it's there just to illustrate that trait
object is an instance of `Trait` and there for it inherits all the properties
(described in the following sections) from `Trait.prototype`.

### required properties ###

Trait in addition to providing properties can also require properties. Required
properties can be defined by properties with a singleton value `Trait.required`
(see `baz` property in the example). Instantiation of such traits will fail
unless those requirements are satisfied (see "Trait instantiation" section).

## Trait instantiation ##

Trait instances inherit `create` method that is used to instantiate objects
with a properties defined by it. Method optionally takes one argument from
which resulting object will inherit. If argument is not passed
`Object.prototoype` will be used instead.

    var TFoo = Trait({
      foo: 'foo',
      bar: 2
    })
    var foo1 = TFoo.create()
    var foo2 = TFoo.create({ name: 'Super' })

Here is a representation of `foo1` and `foo2` (Property `__proto__` is only used
to illustrate prototype chains).

    // foo1
    { foo: 'foo',
      bar: 2,
      __proto__: Object.prototype
    }

    // foo2
    { foo: 'foo',
      bar: 2,
      __proto__: {
        name: 'Super',
        __proto__: Object.prototype
      }
    }

Now let's take a look at trait `T1` again (from the very first example). In
contrast to `TFoo` it defines required properties that have to be satisfied
during instantiation:

      var bar1 = TBar.create()
      var bar2 = TBar.create({ name: 'Super' })
      var bar3 = TBar.create({ baz: 'baz' })

First two lines of the example above will throw exceptions with a message
`'Missing required property: baz'` unlike the third line which satisfies
required `baz` property by providing `baz` property through a prototype chain.

## Trait composition ##

Since traits represent building blocks encapsulating common piece of
functionality composing new building blocks out of existing ones is pretty
common. Function `Trait` can takes multiple traits as an arguments and returns
a single, fresh, "composite" trait containing all of the properties of its
arguments:

    var TEquality = Trait({
      equal: Trait.required,
      notEqual: function notEqual(x) {
        return !this.equal(x)
      }
    });
    var TComparison = Trait({
      less: Trait.required,
      notEqual: Trait.required,
      greater: function greater(x) {
        return !this.less(x) && this.notEqual(x)
      }
    });
    var TMagnitude = Trait(TEquality, TComparison);

This composition can also be illustrated as a following graph:

<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink" version="1.1" viewBox="-11 121 490 190" width="490px" height="190px">
  <defs>
    <marker orient="auto" overflow="visible" markerUnits="strokeWidth" id="SharpArrow_Marker" viewBox="-4 -4 10 8" markerWidth="10" markerHeight="8" color="black">
      <g>
        <path d="M 5 0 L -3 -3 L 0 0 L 0 0 L -3 3 Z" fill="currentColor" stroke="currentColor" stroke-width="1px"/>
      </g>
    </marker>
  </defs>
  <g stroke="none" stroke-opacity="1" stroke-dasharray="none" fill="none" fill-opacity="1">
    <g>
      <rect x="9" y="165.33334" width="141" height="14"/>
      <rect x="9" y="165.33334" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 165.33334)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" x="0" y="11" textLength="47.373047">notEqual</tspan>
      </text>
      <rect x="9" y="151.33334" width="141" height="14"/>
      <rect x="9" y="151.33334" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 151.33334)" fill="red">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" fill="red" x="0" y="11" textLength="29.361328">equal</tspan>
      </text>
      <rect x="9" y="137.33334" width="141" height="14"/>
      <rect x="9" y="137.33334" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 137.33334)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="bold" x="38.49707" y="11" textLength="54.00586">TEquality</tspan>
      </text>
      <rect x="9" y="273" width="141" height="14"/>
      <rect x="9" y="273" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 273)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" x="0" y="11" textLength="38.021484">greater</tspan>
      </text>
      <rect x="9" y="259" width="141" height="14"/>
      <rect x="9" y="259" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 259)" fill="red">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" fill="red" x="0" y="11" textLength="47.373047">notEqual</tspan>
      </text>
      <rect x="9" y="245" width="141" height="14"/>
      <rect x="9" y="245" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 245)" fill="red">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" fill="red" x="0" y="11" textLength="21.339844">less</tspan>
      </text>
      <rect x="9" y="231" width="141" height="14"/>
      <rect x="9" y="231" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(14 231)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="bold" x=".15332031" y="11" textLength="112.67578">TComparison</tspan>
      </text>
      <rect x="317.75" y="235.5" width="141" height="14"/>
      <rect x="317.75" y="235.5" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(322.75 235.5)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" x="0" y="11" textLength="38.021484">greater</tspan>
      </text>
      <rect x="317.75" y="221.5" width="141" height="14"/> 
      <rect x="317.75" y="221.5" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(322.75 221.5)" fill="red">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" fill="red" x="0" y="11" textLength="21.339844">less</tspan>
      </text>
      <rect x="317.75" y="207.5" width="141" height="14"/>
      <rect x="317.75" y="207.5" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(322.75 207.5)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" x="0" y="11" textLength="47.373047">notEqual</tspan>
      </text>
      <rect x="317.75" y="193.5" width="141" height="14"/>
      <rect x="317.75" y="193.5" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(322.75 193.5)" fill="red">
        <tspan font-family="Helvetica" font-size="12" font-weight="500" fill="red" x="0" y="11" textLength="29.361328">equal</tspan>
      </text>
      <rect x="317.75" y="179.5" width="141" height="14"/>
      <rect x="317.75" y="179.5" width="141" height="14" stroke="black" stroke-width="1px"/>
      <text transform="translate(322.75 179.5)" fill="black">
        <tspan font-family="Helvetica" font-size="12" font-weight="bold" x="31.83789" y="11" textLength="67.32422">TMagnitude</tspan>
      </text>
      <path d="M 150 248.83887 L 158.89999 248.83887 L 235.9 248.83887 L 235.9 224.66113 L 308.85 224.66113 L 310.85 224.66113" marker-end="url(#SharpArrow_Marker)" stroke="black" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1px"/>
      <path d="M 150 171.15845 L 158.89999 171.15845 L 233.9 171.15845 L 233.9 201.6749 L 308.85 201.6749 L 310.85 201.6749" marker-end="url(#SharpArrow_Marker)" stroke="black" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="1px"/>
    </g>
  </g>
</svg>

As you can see **required** properties can also be satisfied through a
compositions as in this example `notEqual` required property of a `TComparison`
trait was satisfied by a `TEquality` trait's same named property.

## Trait resolution ##

Trait compositions will lead to conflicts if traits composed provide same named
properties:

    var T1 = Trait({
      foo: function () {
        // do something
      },
      bar: 'bar',
      t1: 1
    });
    var T2 = Trait({
      foo: function() {
        // do something else
      },
      bar: 'bar',
      t2: 2
    });
    var TC = Trait(T2, T1);
    TC.create()

Last line of this example will throw an exception with a message: `"Remaining
conflicting property: foo"`. Such conflicts can be resolved by calling `resolve`
inherited method of a trait / traits of a composition that takes an object
literal as an argument representing resolution map and returns newly composed
trait with resolved properties.

### Resolving conflicting properties to a required properties ###

When desired result of a composition is just an overridden property it's best to
resolve conflicting property to a required property. In that case another
conflicting property will just satisfy created required property:

    var TC2 = (T2.resolve({ foo: null }), T1)

### Renaming conflicting properties ###

In other cases final composition might need to keep all the conflicting
properties. In this case conflicting properties be renamed:

    var TC3 = (T1.resolve({ foo: 'foo1' }), T2)

Also please note that `bar` property have not created a conflict, that's because
the properties with a same values don't cause any conflicts, for the same reason
result of the following example is the same as `TC3`.

    Trait(TC3, TC3, T2)

## Interchangeability ##

As it was mentioned traits are ES5 property descriptor maps and there for they
are freely interchangeable. Traits can be used as descriptor maps with build in
JavaScript  methods:

    Object.create(proto, TFoo)
    Object.defineProperties(myObject, TBar)

Please note though that traits with conflicting / required properties won't
throw exceptions with those functions, instead exceptions will be thrown on
property such a property access of created object.

Also this works other way round, property descriptor maps can be used in
compositions. This may be useful for defining non-enumerable properties for
example:

    var TC = Trait(
      Trait({ foo: 'foo' }),
      { bar: { value: 'bar', enumerable: false } }
    )

_Also please make sure that more that property descriptor map is not the only one
argument to a `Trait`, since in that case it will be interpreted as object
literal with a properties to be defined._

## Mixing traits with a regular inheritance ##

It's important to notice that traits are not replacement for native inheritance
mechanism, in fact it's combining both will give a much better results:

    // Classes
    function Point(options) {
      var PointTrait.create(Point.prototype)
      // constructor logic here
    }

    // Derived classes
    function Derived() {
      // some logic here
    }
    Derived.prototype = TSuper.create(Derived.prototype)


[Ecmascript-262, Edition 5]:http://www.ecma-international.org/publications/standards/Ecma-262.htm
[Traits]:http://en.wikipedia.org/wiki/Trait_%28computer_science%29
[mixins]:http://en.wikipedia.org/wiki/Mixins
[multiple inheritance]:http://en.wikipedia.org/wiki/Multiple_inheritance
