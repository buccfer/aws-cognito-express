'use strict'

const {
  expect, chance, nock, httpStatus
} = require('./index')
const { generateConfig, jwks, pems } = require('./util')
const AWSCognitoJWTValidator = require('../src')
const { DEFAULT_AWS_REGION, TOKEN_USE, REFRESH_WAIT_MS } = require('../src/constants')
const { ConfigurationError, InitializationError } = require('../src/errors')

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

    it('Should throw ConfigurationError if tokenUse is not an array', () => {
      config.tokenUse = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"tokenUse" must be an array/)
    })

    it('Should throw ConfigurationError if tokenUse is an empty array', () => {
      config.tokenUse = []
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"tokenUse" must contain at least 1 item/
      )
    })

    it('Should throw ConfigurationError if tokenUse has repeated items', () => {
      config.tokenUse = [TOKEN_USE.ACCESS, TOKEN_USE.ID, TOKEN_USE.ACCESS]
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /contains a duplicate value/)
    })

    it('Should throw ConfigurationError if tokenUse has invalid items', () => {
      config.tokenUse = [TOKEN_USE.ACCESS, chance.word()]
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /must be one of \[id, access]$/)
    })

    it(`Should have a default tokenUse with value ${[TOKEN_USE.ACCESS]}`, () => {
      Reflect.deleteProperty(config, 'tokenUse')
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.have.property('tokenUse').that.is.deep.equal([TOKEN_USE.ACCESS])
    })

    it('Should throw ConfigurationError if audience is not an array', () => {
      config.audience = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"audience" must be an array/)
    })

    it('Should throw ConfigurationError if audience is an empty array', () => {
      config.audience = []
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"audience" must contain at least 1 item/
      )
    })

    it('Should throw ConfigurationError if audience has repeated items', () => {
      const appId = chance.hash()
      config.audience = [appId, chance.hash(), appId]
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /contains a duplicate value/)
    })

    it('Should throw ConfigurationError if audience has invalid items', () => {
      config.audience = [chance.hash(), chance.natural()]
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /must be a string/)
    })

    it('Should throw ConfigurationError if no audience is passed', () => {
      Reflect.deleteProperty(config, 'audience')
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"audience" is required/)
    })

    it('Should throw ConfigurationError if pems is not an object', () => {
      config.pems = chance.natural()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(ConfigurationError, /"pems" must be an object/)
    })

    it('Should throw ConfigurationError if pems is an empty object', () => {
      config.pems = {}
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        /"pems" must have at least 1 children/
      )
    })

    it('Should have a default pems with value null', () => {
      expect(config).not.to.have.property('pems')
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.have.property('pems').that.is.null
    })

    it('Should throw ConfigurationError if providing an unknown config', () => {
      const propName = chance.word()
      config[propName] = chance.sentence()
      expect(() => new AWSCognitoJWTValidator(config)).to.throw(
        ConfigurationError,
        new RegExp(`"${propName}" is not allowed`)
      )
    })

    it('Should instantiate the validator', () => {
      config = generateConfig({ withPems: true })
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator).to.be.an.instanceof(AWSCognitoJWTValidator)
      expect(validator).to.have.all.keys('region', 'userPoolId', 'tokenUse', 'audience', 'pems', 'init', 'refreshPems')
      expect(validator.region).to.equal(config.region)
      expect(validator.userPoolId).to.equal(config.userPoolId)
      expect(validator.tokenUse).to.deep.equal(config.tokenUse)
      expect(validator.audience).to.deep.equal(config.audience)
      expect(validator.pems).to.deep.equal(config.pems)
      expect(validator.init).to.be.a('function')
      expect(validator.refreshPems).to.be.a('function')
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

  describe('Init', () => {
    let config

    before(() => {
      if (!nock.isActive()) nock.activate()
    })

    beforeEach(() => {
      nock.cleanAll()
      config = generateConfig()
    })

    after(() => {
      nock.cleanAll()
      nock.restore()
    })

    it('Should resolve if pems are already set', async () => {
      config = generateConfig({ withPems: true })
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.deep.equal(config.pems)
      const scope = nock(validator.jwksUrl).get('').reply(httpStatus.OK, { keys: jwks })
      await expect(validator.init()).to.eventually.be.undefined
      expect(scope.isDone()).to.be.false
    })

    it('Should reject with InitializationError if request to the JWKs endpoint returns a non 2xx code', async () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.be.null
      const scope = nock(validator.jwksUrl).get('').reply(httpStatus.NOT_FOUND)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(scope.isDone()).to.be.true
      expect(validator.pems).to.be.null
    })

    it('Should reject with InitializationError if some JWK is invalid', async () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.be.null
      const scope = nock(validator.jwksUrl).get('').reply(httpStatus.OK, {
        keys: jwks.concat([{ value: chance.natural() }])
      })
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        'Initialization failed: Expected "jwk.kty" to be a String'
      )
      expect(scope.isDone()).to.be.true
      expect(validator.pems).to.be.null
    })

    it('Should set the instance pems correctly', async () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.be.null
      const scope = nock(validator.jwksUrl).get('').reply(httpStatus.OK, { keys: jwks })
      await expect(validator.init()).to.eventually.be.undefined
      expect(scope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal(pems)
    })

    it('Should return the same result if calling more than once and the promise is rejected', async () => {
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.be.null

      // First call.
      const firstScope = nock(validator.jwksUrl).get('').reply(httpStatus.NOT_FOUND)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(firstScope.isDone()).to.be.true
      expect(validator.pems).to.be.null
      nock.cleanAll()

      // Second call.
      const secondScope = nock(validator.jwksUrl).get('').reply(httpStatus.FORBIDDEN)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(secondScope.isDone()).to.be.false
      expect(validator.pems).to.be.null
    })

    it('Should return the same result if calling more than once and the promise is resolved', async () => {
      const [jwk1, jwk2] = jwks
      const validator = new AWSCognitoJWTValidator(config)
      expect(validator.pems).to.be.null

      // First call.
      const firstScope = nock(validator.jwksUrl).get('').reply(httpStatus.OK, { keys: [jwk1] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(firstScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
      nock.cleanAll()

      // Second call.
      const secondScope = nock(validator.jwksUrl).get('').reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(secondScope.isDone()).to.be.false
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
    })
  })

  describe('Refresh Pems', () => {
    it('Should refresh the pems successfully')
    it('Should reject with RefreshError if refreshing the pems fails')
    it(`Should not refresh more than once every ${REFRESH_WAIT_MS} milliseconds`)
  })
})
