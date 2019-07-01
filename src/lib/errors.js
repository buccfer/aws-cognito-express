'use strict'

class BaseError extends Error {
  /**
   * @private
   * @description Instantiates a BaseError.
   * @param {string} message - The error message.
   * @returns {BaseError} An instance of a BaseError.
   * */
  constructor(message) {
    super()
    this.message = message
    this.name = this.constructor.name
    this.isJWTValidatorError = true
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error which is thrown when the provided JWT Validator configuration is invalid.
 * @category Errors
 * */
class ConfigurationError extends BaseError {
  /**
   * @private
   * @description Instantiates a ConfigurationError.
   * @param {Error} err - An instance of a Joi ValidationError.
   * @returns {ConfigurationError} An instance of a ConfigurationError.
   * */
  constructor(err) {
    const errDescription = err.details.map(error => error.message).join(', ')
    super(`Invalid configuration: ${errDescription}`)
  }
}

/**
 * Error which is thrown when there's an error initializing the JWT Validator.
 * The initialization process consists in getting the JWKs for the configured User Pool
 * and convert them to pems.
 * @category Errors
 * */
class InitializationError extends BaseError {
  /**
   * @private
   * @description Instantiates an InitializationError.
   * @param {Error} err - An instance of an Error.
   * @returns {InitializationError} An instance of an InitializationError.
   * */
  constructor(err) {
    super(`Initialization failed: ${err.message}`)
  }
}

/**
 * Error which is thrown when there's an error refreshing the JWT Validator pems.
 * Refreshing the pems only takes place if JWKs are rotated.
 * @category Errors
 * */
class RefreshError extends BaseError {
  /**
   * @private
   * @description Instantiates a RefreshError.
   * @param {InitializationError} err - An instance of an InitializationError.
   * @returns {RefreshError} An instance of a RefreshError.
   * */
  constructor(err) {
    super(err.message.replace('Initialization failed:', 'Refresh failed:'))
  }
}

/**
 * Error which is thrown when the provided JWT is invalid.
 * @category Errors
 * */
class InvalidJWTError extends BaseError {}

module.exports = {
  BaseError,
  ConfigurationError,
  InitializationError,
  RefreshError,
  InvalidJWTError
}
