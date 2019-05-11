'use strict'

const _ = require('lodash')
const { expect, chance } = require('./index')
const AWSCognitoJWTValidator = require('../src')
const { DEFAULT_AWS_REGION, DEFAULT_TOKEN_EXPIRATION_IN_SECONDS, TOKEN_USE } = require('../src/constants')
const { ConfigurationError } = require('../src/errors')

const generateConfig = () => ({
  region: chance.pickone(['us-east-2', 'eu-central-1', 'ap-southeast-1', 'us-west-2', 'sa-east-1']),
  userPoolId: chance.hash(),
  tokenUse: chance.pickone(Object.values(TOKEN_USE)),
  tokenExpirationInSeconds: chance.integer({ min: 1, max: 5000 })
})

describe('Validator', () => {
  describe('Constructor', () => {
    let config

    beforeEach(() => {
      config = generateConfig()
    })

    it('Should throw ConfigurationError if no config is passed', () => {
      expect(() => new AWSCognitoJWTValidator()).to.throw(ConfigurationError, /"value" is required/)
    })

    it('Should throw ConfigurationError if config is not an object', () => {
      expect(() => new AWSCognitoJWTValidator(chance.word())).to.throw(ConfigurationError, /"value" must be an object/)
    })

    it('Should throw ConfigurationError if region is not a string', () => {
      config.region = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"region" must be a string/)
    })

    it(`Should have a default region with value "${DEFAULT_AWS_REGION}"`, () => {
      Reflect.deleteProperty(config, 'region')
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.have.property('region', DEFAULT_AWS_REGION)
    })

    it('Should throw ConfigurationError if no userPoolId is passed', () => {
      Reflect.deleteProperty(config, 'userPoolId')
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"userPoolId" is required/)
    })

    it('Should throw ConfigurationError if userPoolId is not a string', () => {
      config.userPoolId = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"userPoolId" must be a string/)
    })

    it('Should throw ConfigurationError if tokenUse is not a string', () => {
      config.tokenUse = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"tokenUse" must be a string/)
    })

    it('Should throw ConfigurationError if tokenUse is invalid', () => {
      config.tokenUse = chance.word()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"tokenUse" must be one of/)
    })

    it(`Should have a default tokenUse with value "${TOKEN_USE.ACCESS}"`, () => {
      Reflect.deleteProperty(config, 'tokenUse')
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.have.property('tokenUse', TOKEN_USE.ACCESS)
    })

    it('Should throw ConfigurationError if tokenExpirationInSeconds is not a number', () => {
      config.tokenExpirationInSeconds = chance.word()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"tokenExpirationInSeconds" must be a number/
      )
    })

    it('Should throw ConfigurationError if tokenExpirationInSeconds is not an integer', () => {
      config.tokenExpirationInSeconds = chance.floating({ min: 0, max: 100 })
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"tokenExpirationInSeconds" must be an integer/
      )
    })

    it('Should throw ConfigurationError if tokenExpirationInSeconds is not a positive integer', () => {
      config.tokenExpirationInSeconds = chance.integer({ min: -100, max: -1 })
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"tokenExpirationInSeconds" must be a positive number/
      )
    })

    it(`Should have a default tokenExpirationInSeconds with value ${DEFAULT_TOKEN_EXPIRATION_IN_SECONDS}`, () => {
      Reflect.deleteProperty(config, 'tokenExpirationInSeconds')
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.have.property('tokenExpirationInSeconds', DEFAULT_TOKEN_EXPIRATION_IN_SECONDS)
    })

    it('Should instantiate the validator', () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.be.an.instanceof(AWSCognitoJWTValidator)
      expect(_.pick(validator, ['region', 'userPoolId', 'tokenUse', 'tokenExpirationInSeconds'])).to.deep.equal(config)
    })
  })

  describe('Getters', () => {
    let config

    beforeEach(() => {
      config = generateConfig()
    })

    it('Should return the correct issuer for the configured User Pool', () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.iss).to.equal(`https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`)
    })

    it('Should return the correct JWKs url for the configured User Pool', () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.jwksUrl).to.equal(
        `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}/.well-known/jwks.json`
      )
    })
  })
})
