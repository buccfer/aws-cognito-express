'use strict'

const { expect, chance } = require('./index')
const AWSCognitoJWTValidator = require('../src')
const { DEFAULT_AWS_REGION, DEFAULT_TOKEN_EXPIRATION_IN_SECONDS, TOKEN_USE } = require('../src/constants')

describe('Validator', () => {
  describe('Constructor', () => {
    it('Should throw ConfigurationError if no config is passed')
    it('Should throw ConfigurationError if config is not an object')
    it('Should throw ConfigurationError if region is not a string')
    it(`Should have a default region with value "${DEFAULT_AWS_REGION}"`)
    it('Should throw ConfigurationError if no userPoolId is passed')
    it('Should throw ConfigurationError if userPoolId is not a string')
    it('Should throw ConfigurationError if tokenUse is not a string')
    it('Should throw ConfigurationError if tokenUse is invalid')
    it(`Should have a default tokenUse with value "${TOKEN_USE.ACCESS}"`)
    it('Should throw ConfigurationError if tokenExpirationInSeconds is not a number')
    it('Should throw ConfigurationError if tokenExpirationInSeconds is not an integer')
    it('Should throw ConfigurationError if tokenExpirationInSeconds is not a positive integer')
    it(`Should have a default tokenExpirationInSeconds with value ${DEFAULT_TOKEN_EXPIRATION_IN_SECONDS}`)
    it('Should instantiate the validator')
  })

  it('Should pass', () => {
    const validator = new AWSCognitoJWTValidator({ userPoolId: chance.hash() })
    expect(validator).to.be.an.instanceof(AWSCognitoJWTValidator).that.has.property('userPoolId')
  })
})
