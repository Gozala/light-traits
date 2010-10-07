'use strict'

exports['test traits composed from objects'] = require('./traits')
exports['test traits composed form property descriptor maps'] = require('./property-descriptor-maps')

if (module == require.main) require('test').run(exports)
