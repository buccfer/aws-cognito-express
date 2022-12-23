## 5.0.0 / 2022-12-23

### :boom: Breaking Changes

- Update `jsonwebtoken` dependency to v9 due to security issues. See breaking changes [here](https://github.com/auth0/node-jsonwebtoken/blob/master/CHANGELOG.md#900---2022-12-21).

## 4.0.1 / 2022-06-02

### :lady_beetle: Bug Fixes

- Changed the http library from [SuperAgent](https://www.npmjs.com/package/superagent) to [Axios](https://www.npmjs.com/package/axios) because of size and [security issues](https://security.snyk.io/vuln/SNYK-JS-FORMIDABLE-2838956)

## 4.0.0 / 2022-06-02

### :boom: Breaking Changes

- Drop Node.js v12.x support
- Update dependencies

## 3.2.0 / 2022-02-21

### :lady_beetle: Bug Fixes

- Fixed [#18](https://github.com/buccfer/aws-cognito-express/issues/18) - The `aud` OR `client_id` claim must match one of the audience entries provided in the config.

## 3.1.0 / 2021-09-04

### :tada: Enhancements

- Added [stale bot](https://github.com/probot/stale) to automatically close stale issues or pull requests

## 3.0.0 / 2021-09-03

### :boom: Breaking Changes

- Drop Node.js v10.x support
- Update dependencies