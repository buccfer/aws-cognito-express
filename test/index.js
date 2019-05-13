'use strict'

const chai = require('chai')
const chance = require('chance').Chance()
const nock = require('nock')

module.exports = {
  expect: chai.expect,
  chance,
  nock
}
