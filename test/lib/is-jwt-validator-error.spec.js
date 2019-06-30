'use strict'

const { expect, chance } = require('../index')
const { isJWTValidatorError } = require('../../src')
const {
  ConfigurationError, InitializationError, RefreshError, InvalidJWTError
} = require('../../src/lib/errors')

describe('Is Validator Error', () => {
  it('Should return false if the parameter is NOT an error from this library', () => {
    const err = chance.pickone([
      chance.string(),
      chance.integer(),
      chance.floating(),
      chance.bool(),
      null,
      undefined,
      Symbol(chance.word()),
      new Error('Unexpected error'),
      { notAnError: true },
      chance.n(chance.word, 5)
    ])
    expect(isJWTValidatorError(err)).to.be.false
  })

  it('Should return true if the parameter is an error from this library', () => {
    const joiErr = new Error()
    joiErr.details = [{ message: chance.sentence() }, { message: chance.sentence() }]
    const err = chance.pickone([
      new ConfigurationError(joiErr),
      new InitializationError(new Error('Error while initializing')),
      new RefreshError(new InitializationError(new Error('Error while refreshing'))),
      new InvalidJWTError('Invalid JWT')
    ])
    expect(isJWTValidatorError(err)).to.be.true
  })
})
