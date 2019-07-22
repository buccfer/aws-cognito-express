'use strict'

const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const { pem2jwk } = require('pem-jwk')
const { chance } = require('./index')
const { TOKEN_USE } = require('../src/lib/constants')

/**
 * @private
 * @description Reads the given RSA key.
 * @param {string} keyFileName - The key file name. Ex: 'key_1.pub'.
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
 * @description Generates random configuration for a JWT Validator.
 * @param {Object} opts - Options for config generator.
 * @param {boolean} opts.withPems - Whether config should include custom pems or not.
 * @returns {Object} A configuration object to be used when instantiating a JWT Validator.
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

/**
 * @private
 * @description Creates a signed JWT.
 * @throws {Error} The provided keyId doesn't match with any RSA Key ID.
 * @param {string} keyId - The ID of the RSA key pair to use to sign the token.
 * @param {Object} payload - The JWT payload.
 * @param {Object} opts - Additional options to generate the JWT.
 * @param {string} opts.audience - A value for the audience (aud) field.
 * @param {string} opts.issuer - A value for the issuer (iss) field.
 * @param {string} opts.tokenUse - A value for the token use (token_use) field. ('id' | 'access')
 * @param {number} [opts.expiresIn = 3600] - The number of seconds until the token expires.
 * @param {string} [opts.kid] - A custom value for the kid header.
 * @returns {string} The signed JWT.
 * */
function signToken(keyId, payload, opts) {
  const targetRSAKeyPair = rsaKeyPairs.find(rsaKeyPair => rsaKeyPair.id === keyId)

  if (!targetRSAKeyPair) throw new Error(`No RSA key pair found with ID ${keyId}`)

  const options = {
    algorithm: 'RS256',
    keyid: opts.kid || keyId,
    expiresIn: opts.expiresIn || 3600,
    audience: opts.audience,
    issuer: opts.issuer
  }

  const jwtPayload = Object.assign({}, payload, { token_use: opts.tokenUse })

  return jwt.sign(jwtPayload, targetRSAKeyPair.private, options)
}

module.exports = {
  generateConfig,
  signToken,
  jwks,
  pems
}
