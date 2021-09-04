'use strict'

const Joi = require('joi')
const { DEFAULT_AWS_REGION, TOKEN_USE } = require('./constants')

/* eslint-disable newline-per-chained-call, max-len */
module.exports = Joi.object().required().keys({
  region: Joi.string().default(DEFAULT_AWS_REGION),
  userPoolId: Joi.string().required(),
  tokenUse: Joi.array().min(1).unique().items(Joi.string().valid(...Object.values(TOKEN_USE))).default([TOKEN_USE.ACCESS]),
  audience: Joi.array().min(1).unique().items(Joi.string()).required(),
  pems: Joi.object().min(1).default(null)
})
