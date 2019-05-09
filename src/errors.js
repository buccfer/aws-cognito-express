'use strict'

class BaseError extends Error {
  constructor(message) {
    super()
    this.message = message
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class ConfigurationError extends BaseError {
  constructor(err) {
    const errDescription = err.details.map(error => error.message).join(', ')
    super(`Invalid configuration: ${errDescription}`)
  }
}

module.exports = {
  ConfigurationError
}
