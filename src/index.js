'use strict'

const debug = require('debug')('AWSCognitoJWTValidator')
const Joi = require('@hapi/joi')
const request = require('superagent')
const once = require('lodash.once')
const jwkToPem = require('jwk-to-pem')
const jwt = require('jsonwebtoken')
const verify = require('./verify')
const { DEFAULT_AWS_REGION, TOKEN_USE } = require('./constants')
const {
  ConfigurationError, InitializationError, RefreshError, InvalidJWTError
} = require('./errors')

/* eslint-disable newline-per-chained-call */
const configSchema = Joi.object().required().keys({
  region: Joi.string().default(DEFAULT_AWS_REGION),
  userPoolId: Joi.string().required(),
  tokenUse: Joi.array().min(1).unique().items(Joi.string().valid(Object.values(TOKEN_USE))).default([TOKEN_USE.ACCESS]),
  audience: Joi.array().min(1).unique().items(Joi.string()).required(),
  pems: Joi.object().min(1).default(null)
})
/* eslint-enable newline-per-chained-call */

class AWSCognitoJWTValidator {
  /**
   * @constructor
   *
   * @description Instantiates a validator.
   *
   * @param {Object} config - The validator configuration.
   * @param {string} [config.region = 'us-east-1'] - The AWS Region where the Cognito User Pool was created.
   * @param {string} config.userPoolId - The Cognito User Pool ID.
   * @param {string[]} [config.tokenUse = ['access']] - The accepted token use/s: 'id' | 'access'.
   * @param {string[]} config.audience - A set of app client IDs that have access to the Cognito User Pool.
   * @param {Object} [config.pems = null] - The custom pems to be used to verify the token signature.
   *
   * @returns {AWSCognitoJWTValidator} A validator instance.
   * */
  constructor(config) {
    debug('Instantiating validator with config: %O', config)
    const { error, value } = Joi.validate(config, configSchema)
    if (error) throw new ConfigurationError(error)
    Object.assign(this, value)
    this.init = once(this.initialize)
  }

  /**
   * @private
   *
   * @description Get the issuer for the configured User Pool.
   *
   * @returns {string} The expected value of the JWT iss claim.
   * */
  get iss() {
    return `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`
  }

  /**
   * @private
   *
   * @description Get the JWKs url for the configured User Pool.
   *
   * @returns {string} The URL where the User Pool JWKs are located.
   * */
  get jwksUrl() {
    return `${this.iss}/.well-known/jwks.json`
  }

  /**
   * @private
   *
   * @description Initializes a validator by getting the User Pool JWKs and converting them to pems.
   *
   * @returns {Promise<undefined>} A promise that will be resolved if the validator could be
   * initialized successfully. Otherwise, it will be rejected with the appropriate error.
   * */
  async initialize() {
    if (this.pems) {
      debug('Validator pems already set. Skipping http request to JWKs endpoint..')
      return
    }

    try {
      debug(`Getting JWKs from ${this.jwksUrl}`)
      const { body: { keys: jwks } } = await request.get(this.jwksUrl)
      debug('Generating pems from JWKs: %O', jwks)
      this.pems = jwks.reduce(
        (acc, jwk) => {
          acc[jwk.kid] = jwkToPem(jwk, { private: false })
          return acc
        },
        {}
      )
      debug('Validator pems set to: %O', this.pems)
    } catch (err) {
      debug('Error while setting validator pems: %O', err)
      throw new InitializationError(err)
    }
  }

  /**
   * @private
   *
   * @description Refreshes a validator pems in case JWKs were rotated.
   *
   * @returns {Promise<undefined>} A promise that will be resolved if the validator pems could be
   * refreshed successfully. Otherwise, it will be rejected with the appropriate error.
   * */
  async refresh() {
    debug('Refreshing validator pems..')
    this.pems = null

    try {
      await this.initialize()
    } catch (err) {
      throw new RefreshError(err)
    }
  }

  /**
   * @description Validates a JSON web token.
   *
   * @param {string} token - The JSON web token to validate.
   *
   * @returns {Promise<Object>} A promise that resolves to the JWT payload.
   * Otherwise, it will be rejected with the appropriate error.
   * */
  async validate(token) {
    await this.init()

    debug('Decoding JWT to get the "kid" header')
    const decodedToken = jwt.decode(token, { complete: true })

    if (!decodedToken) {
      debug('JWT is invalid')
      throw new InvalidJWTError('JWT is invalid')
    }

    const { kid } = decodedToken.header
    debug(`Getting pem for kid ${kid}`)
    const pem = this.pems[kid] // TODO: esto se puede romper si es null pems

    if (!pem) {
      debug(`No pem found for kid ${kid}`)
      throw new InvalidJWTError('No pem found to verify JWT signature')
    }

    debug('Verifying JWT signature..')
    return verify(token, pem, { audience: this.audience, issuer: this.iss, tokenUse: this.tokenUse })

    // TODO: check how to refresh jwks if Cognito keys are rotated. (throttle)
    // TODO: fix tests.
  }
}

module.exports = AWSCognitoJWTValidator
