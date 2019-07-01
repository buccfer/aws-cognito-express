'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when the provided JWT Validator configuration is invalid.
 * @category Errors
 * */
class ConfigurationError extends BaseError {
  /**
   * @description Instantiates a ConfigurationError.
   * @param {Error} err - An instance of a Joi ValidationError.
   * @returns {ConfigurationError} An instance of a ConfigurationError.
   * */
  constructor(err) {
    const errDescription = err.details.map(error => error.message).join(', ')
    super(`Invalid configuration: ${errDescription}`)
  }
}

module.exports = ConfigurationError