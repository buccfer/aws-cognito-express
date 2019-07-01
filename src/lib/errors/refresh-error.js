'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when there's an error refreshing the JWT Validator pems.
 * Refreshing the pems only takes place if JWKs are rotated.
 * @category Errors
 * */
class RefreshError extends BaseError {
  /**
   * @description Instantiates a RefreshError.
   * @param {InitializationError} err - An instance of an InitializationError.
   * @returns {RefreshError} An instance of a RefreshError.
   * */
  constructor(err) {
    super(err.message.replace('Initialization failed:', 'Refresh failed:'))
  }
}

module.exports = RefreshError