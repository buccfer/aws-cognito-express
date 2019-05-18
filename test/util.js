'use strict'

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const { pem2jwk } = require('pem-jwk')
const { chance } = require('./index')
const { TOKEN_USE } = require('../src/constants')

/**
 * @description Reads the given RSA key.
 *
 * @param {String} keyFileName - The key file name. Ex: 'key_1.pub'.
 *
 * @returns {String} - The content of the key file.
 * */
function readRSAKey(keyFileName) {
  const keyPath = path.join(__dirname, 'rsa_keys', keyFileName)
  return fs.readFileSync(keyPath, 'ascii')
}

/**
 * @description Generates random configuration for a validator.
 *
 * @param {Object} opts - Options for config generator.
 * @param {Boolean} opts.withJwks - Whether the config should include custom jwks.
 *
 * @returns {Object} A configuration object to be used when instantiating a validator.
 * */
function generateConfig(opts = {}) {
  const config = {
    region: chance.pickone(['us-east-2', 'eu-central-1', 'ap-southeast-1', 'us-west-2', 'sa-east-1']),
    userPoolId: chance.hash(),
    tokenUse: chance.pickone(_.values(TOKEN_USE)),
    tokenExpirationInSeconds: chance.integer({ min: 1, max: 5000 })
  }

  if (opts.withJwks) {
    config.jwks = []
  }

  return config
}

module.exports = {
  generateConfig
}
