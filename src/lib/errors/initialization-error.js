'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when there's an error initializing the JWT Validator.
 * The initialization process consists in getting the JWKs for the configured User Pool
 * and convert them to pems.
 * @category Errors
 * @hideconstructor
 * */
class InitializationError extends BaseError {
  /**
   * @description Instantiates an InitializationError.
   * @param {Error} err - An instance of an Error.
   * */
  constructor(err) {
    super(`Initialization failed: ${err.message}`)
  }
}

module.exports = InitializationError
