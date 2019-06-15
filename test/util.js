'use strict'

const fs = require('fs')
const path = require('path')
const { pem2jwk } = require('pem-jwk')
const { chance } = require('./index')
const { TOKEN_USE } = require('../src/constants')

/**
 * @private
 *
 * @description Reads the given RSA key.
 *
 * @param {string} keyFileName - The key file name. Ex: 'key_1.pub'.
 *
 * @returns {string} - The content of the key file.
 * */
function readRSAKey(keyFileName) {
  const keyPath = path.join(__dirname, 'rsa_keys', keyFileName)
  return fs.readFileSync(keyPath, 'ascii')
}

const rsaKeyPairs = [
  {
    id: 'key_1',
    public: readRSAKey('key_1.pub'),
    private: readRSAKey('key_1')
  },
  {
    id: 'key_2',
    public: readRSAKey('key_2.pub'),
    private: readRSAKey('key_2')
  }
]

const jwks = rsaKeyPairs.map(rsaKeyPair => Object.assign(
  { kid: rsaKeyPair.id, alg: 'RS256', use: 'sig' },
  pem2jwk(rsaKeyPair.public)
))

const pems = rsaKeyPairs.reduce(
  (acc, rsaKeyPair) => {
    acc[rsaKeyPair.id] = rsaKeyPair.public
    return acc
  },
  {}
)

/**
 * @private
 *
 * @description Generates random configuration for a validator.
 *
 * @param {Object} opts - Options for config generator.
 * @param {boolean} opts.withPems - Whether config should include custom pems or not.
 *
 * @returns {Object} A configuration object to be used when instantiating a validator.
 * */
function generateConfig(opts = {}) {
  const config = {
    region: chance.pickone(['us-east-2', 'eu-central-1', 'ap-southeast-1', 'us-west-2', 'sa-east-1']),
    userPoolId: chance.hash(),
    tokenUse: chance.pickset(Object.values(TOKEN_USE), chance.integer({ min: 1, max: 2 })),
    audience: chance.n(chance.hash, chance.integer({ min: 1, max: 3 }))
  }

  if (opts.withPems) config.pems = pems

  return config
}

module.exports = {
  generateConfig,
  jwks,
  pems
}
