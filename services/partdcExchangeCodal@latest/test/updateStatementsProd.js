let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let requestPromise = require('request-promise');
let q = require('q');

/**
 * در این متد با صدا زدن api به روزرسانی در ماشین های dev و prod می توان پایگاه داده آن را به روز کرد.
 * @returns {Promise<*>}
 */
async function updateCodalDB() {
  let defer = q.defer();
  try {
    await init.initMongoRedis();
    let count = 1;
    let updatedCount = 0;
    let obj = [];
    var options = {
      'method': 'GET',
      'url': 'http://partfdfExchangeCodal-dev.partdp.ir/service/partfdfExchangeCodal@latest/statements?from_date=1400/07/12',
      'headers': {
        'Content-Type': 'application/json'
      }
    };
    let response = await requestPromise(options);
    if (response) {
      // stockList = response.body;
      obj = JSON.parse(response);
    }
    async.eachSeries(obj.data.result, async (item) => {
      try {
        let body = {
          "colName": "CodalStatements",
            "query": {
            "tracingNo": item.tracingNo
          },
          "set": item,
          "unset": {
            "y" : ""
          },
          "upsert" : {"upsert": true}
        };
          var options = {
            'method': 'POST',
            'url': 'http://partfdfExchangeCodal-prod.partdp.ir/service/partfdfExchangeCodal@latest/updateOne',
            'headers': {
              'Content-Type': 'application/json'
            },
            'body' : JSON.stringify(body)
          };
          let response = await requestPromise(options);
          if (response) {
            // stockList = response.body;
            let obj = JSON.parse(response);
            utility.consoleLog(obj.data);
          }
      }
      catch (e) {
        utility.consoleLog(e);
      }
    }, (error) => {
      if (error) {
        defer.reject(error);
        utility.consoleLog('===============================');
        utility.consoleLog('Error in innerSeries', error);
        utility.consoleLog('===============================');
      }
      else {
        utility.consoleLog('updated count : ' + '  result : ' + updatedCount);
        defer.resolve();
      }
    });
  }
  catch (e) {
    utility.consoleLog(e);
    defer.reject(e);
  }
  return defer.promise;
}
updateCodalDB();