'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when there's an error refreshing the JWT Validator pems.
 * Refreshing the pems only takes place if JWKs are rotated.
 * @category Errors
 * @hideconstructor
 * */
class RefreshError extends BaseError {
  /**
   * @description Instantiates a RefreshError.
   * @param {InitializationError} err - An instance of an InitializationError.
   * */
  constructor(err) {
    super(err.message.replace('Initialization failed:', 'Refresh failed:'))
  }
}

module.exports = RefreshError
