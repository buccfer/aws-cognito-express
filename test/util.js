'use strict'

const _ = require('lodash')
const { chance } = require('./index')
const { TOKEN_USE } = require('../src/constants')

/**
 * @description Generates random configuration for a validator.
 *
 * @returns {Object} A configuration object to be used when instantiating a validator.
 * */
function generateConfig() {
  return {
    region: chance.pickone(['us-east-2', 'eu-central-1', 'ap-southeast-1', 'us-west-2', 'sa-east-1']),
    userPoolId: chance.hash(),
    tokenUse: chance.pickone(_.values(TOKEN_USE)),
    tokenExpirationInSeconds: chance.integer({ min: 1, max: 5000 })
  }
}

module.exports = {
  generateConfig
}
