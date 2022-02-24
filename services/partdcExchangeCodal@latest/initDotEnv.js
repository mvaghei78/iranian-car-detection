let dotenv = require('dotenv').config({ path: '/opt/devops/env/partdcExchangeCodal/.env' });
if (dotenv.error) {
  dotenv = require('dotenv').config({ path: __dirname + '/.env' });
}