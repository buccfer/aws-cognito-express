'use strict'

const BaseError = require('./base-error')

/**
 * Error which is thrown when the provided JWT is invalid.
 * @category Errors
 * */
class InvalidJWTError extends BaseError {}

module.exports = InvalidJWTError
