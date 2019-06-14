'use strict'

const { expect, chance } = require('./index')
const { BaseError, ConfigurationError, JWKsNotFoundError } = require('../src/errors')

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
      expect(error.isAWSCognitoJWTValidator).to.be.true
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
      expect(error.isAWSCognitoJWTValidator).to.be.true
    })
  })

  describe('JWKsNotFoundError', () => {
    let superagentErr
    let error

    beforeEach(() => {
      superagentErr = { status: chance.pickone([400, 404, 500, 503]), message: chance.sentence() }
      error = new JWKsNotFoundError(superagentErr)
    })

    it('Should be an instance of BaseError', () => {
      expect(error).to.be.an.instanceOf(BaseError)
    })

    it('Should have the correct properties if it is an error response', () => {
      expect(_.pick(error, ['message', 'name', 'isAWSCognitoJWTValidator'])).to.deep.equal({
        message: `Response error: The server responded with status code ${superagentErr.status}.`,
        name: 'JWKsNotFoundError',
        isAWSCognitoJWTValidator: true
      })
    })

    it('Should have the correct properties if it is a request error', () => {
      Reflect.deleteProperty(superagentErr, 'status')
      error = new JWKsNotFoundError(superagentErr)

      expect(_.pick(error, ['message', 'name', 'isAWSCognitoJWTValidator'])).to.deep.equal({
        message: `Request error: ${superagentErr.message}.`,
        name: 'JWKsNotFoundError',
        isAWSCognitoJWTValidator: true
      })
    })
  })
})
