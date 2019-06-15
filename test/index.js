'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chance = require('chance').Chance()
const nock = require('nock')
const httpStatus = require('http-status')

chai.use(chaiAsPromised)

module.exports = {
  expect: chai.expect,
  chance,
  nock,
  httpStatus
}
