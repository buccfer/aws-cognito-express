'use strict'

const debug = require('debug')('AWSCognitoJWTValidator')
const Joi = require('@hapi/joi')
const request = require('superagent')
const _ = require('lodash')
const jwkToPem = require('jwk-to-pem')
const { DEFAULT_AWS_REGION, DEFAULT_TOKEN_EXPIRATION_IN_SECONDS, TOKEN_USE } = require('./constants')
const { ConfigurationError, JWKsNotFoundError } = require('./errors')

const configSchema = Joi.object().required().keys({
  region: Joi.string().default(DEFAULT_AWS_REGION),
  userPoolId: Joi.string().required(),
  tokenUse: Joi.string().valid(Object.values(TOKEN_USE)).default(TOKEN_USE.ACCESS),
  tokenExpirationInSeconds: Joi.number().integer().positive().default(DEFAULT_TOKEN_EXPIRATION_IN_SECONDS),
  jwks: Joi.array().items(Joi.object()).min(1).optional()
})

class AWSCognitoJWTValidator {
  /**
   * @description Instantiates a validator.
   *
   * @param {Object} config - The validator configuration.
   * @param {String} [config.region = 'us-east-1'] - The AWS Region where the Cognito User Pool was created.
   * @param {String} config.userPoolId - The Cognito User Pool ID.
   * @param {String} [config.tokenUse = 'access'] - The token use: 'id' | 'access'.
   * @param {Number} [config.tokenExpirationInSeconds = 3600] - The token expiration time in seconds.
   * @param {Array<Object>} [config.jwks] - The optional JWKs to use for testing.
   *
   * @returns {AWSCognitoJWTValidator} A validator instance.
   * */
  constructor(config) {
    debug('Instantiating validator with config: %O', config)
    const { error, value } = Joi.validate(config, configSchema)
    if (error) throw new ConfigurationError(error)
    _.assign(this, value)
  }

  /**
   * @description Get the issuer for the configured User Pool.
   *
   * @returns {String} The expected value of the JWT iss claim.
   * */
  get iss() {
    return `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`
  }

  /**
   * @description Get the JWKs url for the configured User Pool.
   *
   * @returns {String} The URL where the User Pool JWKs are located.
   * */
  get jwksUrl() {
    return `${this.iss}/.well-known/jwks.json`
  }

  /**
   * @description Get User Pool JWKs.
   *
   * @returns {Promise<undefined>} A promise that will be resolved if the User Pool JWKs were
   * successfully downloaded and stored. Otherwise, the promise will be rejected with the
   * appropriate error.
   * */
  async getJWKs() {
    if (this.jwks) {
      debug('JWKs already set in the instance. Skipping http request..')
      return
    }

    try {
      debug(`Getting JWKs from ${this.jwksUrl}`)
      const response = await request.get(this.jwksUrl)
      debug('JWKs response: %O', response.body)
      this.jwks = _.get(response, 'body.keys', [])
      debug('Updated instance JWKs to: %O', this.jwks)
    } catch (err) {
      debug('Error while getting JWKs: %O', err)
      throw new JWKsNotFoundError(err)
    }
  }

  /**
   * @description Generate pems from the JWKs.
   *
   * @returns {undefined} Pems will be set in the instance if there are valid JWKs.
   * */
  generatePems() {
    if (!Array.isArray(this.jwks)) {
      debug('No JWKs set in the instance. Skipping pem generation..')
      return
    }

    debug('Generating pems from JWKs..')
    this.pems = this.jwks.map(jwk => jwkToPem(jwk, { private: false }))
  }

  /**
   * @description Validate JSON web token.
   *
   * @param {String} token - The JSON web token to validate.
   *
   * @returns {Promise<Object>} A promise that resolves to an object holding the token claims.
   * Otherwise, it will be rejected with the appropriate error.
   * */
  // async validate(token) {
  //   // TODO: get pem.
  // }
}

module.exports = AWSCognitoJWTValidator
