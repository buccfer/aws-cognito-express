'use strict'

class BaseError extends Error {
  /**
   * @description Instantiates a BaseError.
   *
   * @param {String} message - The error message.
   *
   * @returns {BaseError} An instance of a BaseError.
   * */
  constructor(message) {
    super()
    this.message = message
    this.name = this.constructor.name
    this.isAWSCognitoJWTValidator = true
    Error.captureStackTrace(this, this.constructor)
  }
}

class ConfigurationError extends BaseError {
  /**
   * @description Instantiates a ConfigurationError.
   *
   * @param {Error} err - An instance of a Joi ValidationError.
   *
   * @returns {ConfigurationError} An instance of a ConfigurationError.
   * */
  constructor(err) {
    const errDescription = err.details.map(error => error.message).join(', ')
    super(`Invalid configuration: ${errDescription}`)
  }
}

class InitializationError extends BaseError {
  /**
   * @description Instantiates an InitializationError.
   *
   * @param {Error} err - An instance of an Error.
   *
   * @returns {InitializationError} An instance of an InitializationError.
   * */
  constructor(err) {
    super(`Initialization failed: ${err.message}`)
  }
}

class InvalidJWTError extends BaseError {}

module.exports = {
  BaseError,
  ConfigurationError,
  InitializationError,
  InvalidJWTError
}
