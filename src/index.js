'use strict'

const debug = require('debug')('AWSCognitoJWTValidator')
const Joi = require('@hapi/joi')
const { ConfigurationError } = require('./errors')

const DEFAULT_AWS_REGION = 'us-east-1'
const DEFAULT_TOKEN_EXPIRATION_IN_SECONDS = 3600
const TOKEN_USE = { ID: 'id', ACCESS: 'access' }

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
}

module.exports = AWSCognitoJWTValidator
