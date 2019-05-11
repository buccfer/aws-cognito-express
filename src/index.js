'use strict'

const debug = require('debug')('AWSCognitoJWTValidator')
const Joi = require('@hapi/joi')
const { DEFAULT_AWS_REGION, DEFAULT_TOKEN_EXPIRATION_IN_SECONDS, TOKEN_USE } = require('./constants')
const { ConfigurationError } = require('./errors')

const configSchema = Joi.object().required().keys({
  region: Joi.string().default(DEFAULT_AWS_REGION),
  userPoolId: Joi.string().required(),
  tokenUse: Joi.string().valid(Object.values(TOKEN_USE)).default(TOKEN_USE.ACCESS),
  tokenExpirationInSeconds: Joi.number().integer().positive().default(DEFAULT_TOKEN_EXPIRATION_IN_SECONDS)
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
   *
   * @returns {AWSCognitoJWTValidator} A validator instance.
   * */
  constructor(config) {
    debug('Instantiating validator with config: %O', config)
    const { error, value } = Joi.validate(config, configSchema)
    if (error) throw new ConfigurationError(error)
    Object.assign(this, value)
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
   * @description Validate JSON web token.
   *
   * @param {String} token - The JSON web token to validate.
   *
   * @returns {Promise<Object>} A promise that resolves to an object holding the token claims.
   * Otherwise, it will be rejected with the appropriate error.
   * */
  async validate(token) {
    // TODO: get pem.
  }
}

module.exports = AWSCognitoJWTValidator
