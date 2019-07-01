'use strict'

const BaseError = require('./base-error')

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

module.exports = InitializationError
