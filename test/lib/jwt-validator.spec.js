'use strict'

const { URL } = require('url')
const { expect, chance, nock, httpStatus, mockDate } = require('../index')
const { generateConfig, signToken, jwks, pems } = require('../util')
const { JWTValidator } = require('../../index')
const { DEFAULT_AWS_REGION, TOKEN_USE, REFRESH_WAIT_MS } = require('../../src/lib/constants')
const {
  ConfigurationError, InitializationError, RefreshError, InvalidJWTError
} = require('../../src/lib/errors')

const [jwk1, jwk2] = jwks

describe('Validator', () => {
  describe('Constructor', () => {
    let config

    beforeEach(() => {
      config = generateConfig()
    })

    it('Should throw ConfigurationError if no config is passed', () => {
      expect(() => new JWTValidator()).to.throw(ConfigurationError, /"value" is required/)
    })

    it('Should throw ConfigurationError if config is not an object', () => {
      expect(() => new JWTValidator(chance.word())).to.throw(ConfigurationError, /"value" must be of type object/)
    })

    it('Should throw ConfigurationError if region is not a string', () => {
      config.region = chance.natural()
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"region" must be a string/)
    })

    it(`Should have a default region with value "${DEFAULT_AWS_REGION}"`, () => {
      Reflect.deleteProperty(config, 'region')
      const validator = new JWTValidator(config)
      expect(validator).to.have.property('region', DEFAULT_AWS_REGION)
    })

    it('Should throw ConfigurationError if no userPoolId is passed', () => {
      Reflect.deleteProperty(config, 'userPoolId')
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"userPoolId" is required/)
    })

    it('Should throw ConfigurationError if userPoolId is not a string', () => {
      config.userPoolId = chance.natural()
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"userPoolId" must be a string/)
    })

    it('Should throw ConfigurationError if tokenUse is not an array', () => {
      config.tokenUse = chance.natural()
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"tokenUse" must be an array/)
    })

    it('Should throw ConfigurationError if tokenUse is an empty array', () => {
      config.tokenUse = []
      expect(() => new JWTValidator(config)).to.throw(
        ConfigurationError,
        /"tokenUse" must contain at least 1 item/
      )
    })

    it('Should throw ConfigurationError if tokenUse has repeated items', () => {
      config.tokenUse = [TOKEN_USE.ACCESS, TOKEN_USE.ID, TOKEN_USE.ACCESS]
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /contains a duplicate value/)
    })

    it('Should throw ConfigurationError if tokenUse has invalid items', () => {
      config.tokenUse = [TOKEN_USE.ACCESS, chance.word()]
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /must be one of \[id, access]$/)
    })

    it(`Should have a default tokenUse with value ${[TOKEN_USE.ACCESS]}`, () => {
      Reflect.deleteProperty(config, 'tokenUse')
      const validator = new JWTValidator(config)
      expect(validator).to.have.property('tokenUse').that.is.deep.equal([TOKEN_USE.ACCESS])
    })

    it('Should throw ConfigurationError if audience is not an array', () => {
      config.audience = chance.natural()
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"audience" must be an array/)
    })

    it('Should throw ConfigurationError if audience is an empty array', () => {
      config.audience = []
      expect(() => new JWTValidator(config)).to.throw(
        ConfigurationError,
        /"audience" must contain at least 1 item/
      )
    })

    it('Should throw ConfigurationError if audience has repeated items', () => {
      const appId = chance.hash()
      config.audience = [appId, chance.hash(), appId]
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /contains a duplicate value/)
    })

    it('Should throw ConfigurationError if audience has invalid items', () => {
      config.audience = [chance.hash(), chance.natural()]
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /must be a string/)
    })

    it('Should throw ConfigurationError if no audience is passed', () => {
      Reflect.deleteProperty(config, 'audience')
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"audience" is required/)
    })

    it('Should throw ConfigurationError if pems is not an object', () => {
      config.pems = chance.natural()
      expect(() => new JWTValidator(config)).to.throw(ConfigurationError, /"pems" must be of type object/)
    })

    it('Should throw ConfigurationError if pems is an empty object', () => {
      config.pems = {}
      expect(() => new JWTValidator(config)).to.throw(
        ConfigurationError,
        /"pems" must have at least 1 key/
      )
    })

    it('Should have a default pems with value null', () => {
      expect(config).not.to.have.property('pems')
      const validator = new JWTValidator(config)
      expect(validator).to.have.property('pems').that.is.null
    })

    it('Should throw ConfigurationError if providing an unknown config', () => {
      const propName = chance.word()
      config[propName] = chance.sentence()
      expect(() => new JWTValidator(config)).to.throw(
        ConfigurationError,
        new RegExp(`"${propName}" is not allowed`)
      )
    })

    it('Should instantiate the validator', () => {
      config = generateConfig({ withPems: true })
      const validator = new JWTValidator(config)
      expect(validator).to.be.an.instanceof(JWTValidator)
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
      const validator = new JWTValidator(config)
      expect(validator.iss).to.equal(`https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`)
    })

    it('Should return the correct JWKs url for the configured User Pool', () => {
      const validator = new JWTValidator(config)
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
      const validator = new JWTValidator(config)
      expect(validator.pems).to.deep.equal(config.pems)
      const jwksUrl = new URL(validator.jwksUrl)
      const scope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      await expect(validator.init()).to.eventually.be.undefined
      expect(scope.isDone()).to.be.false
    })

    it('Should reject with InitializationError if request to the JWKs endpoint returns a non 2xx code', async () => {
      const validator = new JWTValidator(config)
      expect(validator.pems).to.be.null
      const jwksUrl = new URL(validator.jwksUrl)
      const scope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.NOT_FOUND)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(scope.isDone()).to.be.true
      expect(validator.pems).to.be.null
    })

    it('Should reject with InitializationError if some JWK is invalid', async () => {
      const validator = new JWTValidator(config)
      expect(validator.pems).to.be.null
      const jwksUrl = new URL(validator.jwksUrl)
      const scope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, {
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
      const validator = new JWTValidator(config)
      expect(validator.pems).to.be.null
      const jwksUrl = new URL(validator.jwksUrl)
      const scope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      await expect(validator.init()).to.eventually.be.undefined
      expect(scope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal(pems)
    })

    it('Should return the same result if calling more than once and the promise is rejected', async () => {
      const validator = new JWTValidator(config)
      expect(validator.pems).to.be.null

      // First call.
      const jwksUrl = new URL(validator.jwksUrl)
      const firstScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.NOT_FOUND)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(firstScope.isDone()).to.be.true
      expect(validator.pems).to.be.null
      nock.cleanAll()

      // Second call.
      const secondScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.FORBIDDEN)
      await expect(validator.init()).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(secondScope.isDone()).to.be.false
      expect(validator.pems).to.be.null
    })

    it('Should return the same result if calling more than once and the promise is resolved', async () => {
      const validator = new JWTValidator(config)
      expect(validator.pems).to.be.null

      // First call.
      const jwksUrl = new URL(validator.jwksUrl)
      const firstScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk1] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(firstScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
      nock.cleanAll()

      // Second call.
      const secondScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(secondScope.isDone()).to.be.false
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
    })
  })

  describe('Refresh Pems', () => {
    let validator
    let jwksUrl

    before(() => {
      if (!nock.isActive()) nock.activate()
    })

    beforeEach(async () => {
      nock.cleanAll()

      const config = generateConfig()
      validator = new JWTValidator(config)
      expect(validator.pems).to.be.null

      jwksUrl = new URL(validator.jwksUrl)
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk1] })
      await validator.init()
      expect(initScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })

      nock.cleanAll()
    })

    after(() => {
      nock.cleanAll()
      nock.restore()
    })

    it('Should refresh the pems successfully', async () => {
      const refreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.refreshPems()).to.eventually.be.undefined
      expect(refreshScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
    })

    it('Should reject with RefreshError if refreshing the pems fails', async () => {
      const refreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.SERVICE_UNAVAILABLE)
      await expect(validator.refreshPems()).to.eventually.be.rejectedWith(
        RefreshError,
        `Refresh failed: ${httpStatus[httpStatus.SERVICE_UNAVAILABLE]}`
      )
      expect(refreshScope.isDone()).to.be.true
      expect(validator.pems).to.be.null
    })

    it(`Should not refresh more than once every ${REFRESH_WAIT_MS} milliseconds`, async () => {
      // First refresh.
      const firstRefreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.refreshPems()).to.eventually.be.undefined
      expect(firstRefreshScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
      nock.cleanAll()

      // Second refresh should be throttled since it is within the REFRESH_WAIT_MS window.
      const secondRefreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk1] })
      await expect(validator.refreshPems()).to.eventually.be.undefined
      expect(secondRefreshScope.isDone()).to.be.false
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
      nock.cleanAll()

      // Third refresh should succeed since it is outside the REFRESH_WAIT_MS window.
      mockDate.set(Date.now() + REFRESH_WAIT_MS + 1e3)
      const thirdRefreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk1] })
      await expect(validator.refreshPems()).to.eventually.be.undefined
      expect(thirdRefreshScope.isDone()).to.be.true
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
      mockDate.reset()
    })
  })

  describe('Validate', () => {
    let validator
    let jwksUrl
    let tokenPayload

    before(() => {
      if (!nock.isActive()) nock.activate()
    })

    beforeEach(() => {
      const config = generateConfig()
      validator = new JWTValidator(config)
      jwksUrl = new URL(validator.jwksUrl)
      tokenPayload = {
        email: chance.email(),
        email_verified: chance.bool()
      }
      nock.cleanAll()
    })

    after(() => {
      nock.cleanAll()
      nock.restore()
    })

    it('Should reject with InitializationError if initialization fails', async () => {
      const token = chance.hash()
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.NOT_FOUND)
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(
        InitializationError,
        `Initialization failed: ${httpStatus[httpStatus.NOT_FOUND]}`
      )
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token is invalid', async () => {
      const token = chance.hash()
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(InvalidJWTError, 'JWT is invalid')
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with RefreshError if refreshing the pems fails', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
      expect(initScope.isDone()).to.be.true
      nock.cleanAll()

      const token = signToken('key_1', tokenPayload, {
        audience: chance.hash(),
        issuer: chance.hash(),
        tokenUse: TOKEN_USE.ACCESS
      })
      const refreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.SERVICE_UNAVAILABLE)
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(
        RefreshError,
        `Refresh failed: ${httpStatus[httpStatus.SERVICE_UNAVAILABLE]}`
      )
      expect(refreshScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if there is no pem to verify the token signature', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
      expect(initScope.isDone()).to.be.true
      nock.cleanAll()

      const token = signToken('key_1', tokenPayload, {
        audience: chance.hash(),
        issuer: chance.hash(),
        tokenUse: TOKEN_USE.ACCESS
      })
      const refreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(
        InvalidJWTError,
        'No pem found to verify JWT signature'
      )
      expect(refreshScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token signature is invalid', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: validator.iss,
        tokenUse: chance.pickone(validator.tokenUse),
        kid: 'key_2'
      })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(InvalidJWTError, 'invalid signature')
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token audience is invalid', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.hash(),
        issuer: validator.iss,
        tokenUse: chance.pickone(validator.tokenUse)
      })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(InvalidJWTError, /jwt audience invalid/)
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token issuer is invalid', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: chance.url(),
        tokenUse: chance.pickone(validator.tokenUse)
      })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(InvalidJWTError, /jwt issuer invalid/)
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token tokenUse is invalid', async () => {
      const config = generateConfig()
      config.tokenUse = [TOKEN_USE.ACCESS]
      validator = new JWTValidator(config)
      jwksUrl = new URL(validator.jwksUrl)
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: validator.iss,
        tokenUse: TOKEN_USE.ID
      })
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(
        InvalidJWTError,
        `"${TOKEN_USE.ID}" tokens are not allowed`
      )
      expect(initScope.isDone()).to.be.true
    })

    it('Should reject with InvalidJWTError if token is expired', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: validator.iss,
        tokenUse: chance.pickone(validator.tokenUse),
        expiresIn: 10 // 10 seconds.
      })
      // Set date to now + 11 seconds.
      mockDate.set(Date.now() + 11e3)
      await expect(validator.validate(token)).to.eventually.be.rejectedWith(InvalidJWTError, 'jwt expired')
      expect(initScope.isDone()).to.be.true
      mockDate.reset()
    })

    it('Should resolve with the token payload', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: jwks })
      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: validator.iss,
        tokenUse: chance.pickone(validator.tokenUse)
      })
      const payload = await validator.validate(token)
      expect(payload).to.be.an('object').that.has.all.keys(
        'aud', 'email', 'email_verified', 'exp', 'iat', 'iss', 'token_use'
      )
      const { email, email_verified } = payload // eslint-disable-line camelcase
      expect({ email, email_verified }).to.deep.equal(tokenPayload)
      expect(initScope.isDone()).to.be.true
    })

    it('Should resolve with the token payload after refreshing the pems', async () => {
      const initScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk2] })
      await expect(validator.init()).to.eventually.be.undefined
      expect(validator.pems).to.deep.equal({ [jwk2.kid]: pems[jwk2.kid] })
      expect(initScope.isDone()).to.be.true
      nock.cleanAll()

      const token = signToken('key_1', tokenPayload, {
        audience: chance.pickone(validator.audience),
        issuer: validator.iss,
        tokenUse: chance.pickone(validator.tokenUse)
      })
      const refreshScope = nock(jwksUrl.origin).get(jwksUrl.pathname).reply(httpStatus.OK, { keys: [jwk1] })
      const payload = await validator.validate(token)
      expect(payload).to.be.an('object').that.has.all.keys(
        'aud', 'email', 'email_verified', 'exp', 'iat', 'iss', 'token_use'
      )
      const { email, email_verified } = payload // eslint-disable-line camelcase
      expect({ email, email_verified }).to.deep.equal(tokenPayload)
      expect(validator.pems).to.deep.equal({ [jwk1.kid]: pems[jwk1.kid] })
      expect(refreshScope.isDone()).to.be.true
    })
  })
})
