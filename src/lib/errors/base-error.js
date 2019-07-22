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

module.exports = BaseError
