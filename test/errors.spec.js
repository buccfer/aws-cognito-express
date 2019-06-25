'use strict'

const { expect, chance } = require('./index')
const { BaseError, ConfigurationError, InitializationError, RefreshError, InvalidJWTError } = require('../src/errors')

describe('Errors', () => {
  describe('BaseError', () => {
    let errMsg
    let error

    beforeEach(() => {
      errMsg = chance.sentence()
      error = new BaseError(errMsg)
    })

    it('Should be an instance of Error', () => {
      expect(error).to.be.an.instanceOf(Error)
    })

    it('Should have the correct properties', () => {
      expect(error.message).to.equal(errMsg)
      expect(error.name).to.equal('BaseError')
      expect(error.isAWSCognitoJWTValidatorError).to.be.true
    })
  })

  describe('ConfigurationError', () => {
    let joiErr
    let error

    beforeEach(() => {
      joiErr = { details: [{ message: chance.sentence() }, { message: chance.sentence() }] }
      error = new ConfigurationError(joiErr)
    })

    it('Should be an instance of BaseError', () => {
      expect(error).to.be.an.instanceOf(BaseError)
    })

    it('Should have the correct properties', () => {
      const errDescription = joiErr.details.map(err => err.message).join(', ')
      expect(error.message).to.equal(`Invalid configuration: ${errDescription}`)
      expect(error.name).to.equal('ConfigurationError')
      expect(error.isAWSCognitoJWTValidatorError).to.be.true
    })
  })

  describe('InitializationError', () => {
    let err
    let error

    beforeEach(() => {
      err = { message: chance.sentence() }
      error = new InitializationError(err)
    })

    it('Should be an instance of BaseError', () => {
      expect(error).to.be.an.instanceOf(BaseError)
    })

    it('Should have the correct properties', () => {
      expect(error.message).to.equal(`Initialization failed: ${err.message}`)
      expect(error.name).to.equal('InitializationError')
      expect(error.isAWSCognitoJWTValidatorError).to.be.true
    })
  })

  describe('RefreshError', () => {
    let initializationError
    let error

    beforeEach(() => {
      initializationError = new InitializationError(new Error(chance.sentence()))
      error = new RefreshError(initializationError)
    })

    it('Should be an instance of BaseError', () => {
      expect(error).to.be.an.instanceOf(BaseError)
    })

    it('Should have the correct properties', () => {
      expect(error.message).to.equal(initializationError.message.replace('Initialization failed:', 'Refresh failed:'))
      expect(error.name).to.equal('RefreshError')
      expect(error.isAWSCognitoJWTValidatorError).to.be.true
    })
  })

  describe('InvalidJWTError', () => {
    let errorMsg
    let error

    beforeEach(() => {
      errorMsg = chance.sentence()
      error = new InvalidJWTError(errorMsg)
    })

    it('Should be an instance of BaseError', () => {
      expect(error).to.be.an.instanceOf(BaseError)
    })

    it('Should have the correct properties', () => {
      expect(error.message).to.equal(errorMsg)
      expect(error.name).to.equal('InvalidJWTError')
      expect(error.isAWSCognitoJWTValidatorError).to.be.true
    })
  })
})
