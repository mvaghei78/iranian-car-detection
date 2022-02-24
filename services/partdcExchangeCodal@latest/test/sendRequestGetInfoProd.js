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
    let infoErrorList = await BaseConfig.mongoDBO.collection('infoError').find({count : {'$gte' : 2} }).toArray();
    async.eachSeries(infoErrorList, async (item) => {
      try {
        if (count<=258) {
          // utility.consoleLog('get Interim Statement| count : ' + count + ' of ' + symbolList.length + ' - symbol : ' + item.symbol);
              var options = {
                'method': 'GET',
                'url': 'http://partdcExchangeCodal-prod.partdp.ir/service/partdcExchangeCodal@latest/getStatementsInfo?tracingNo=' + item.tracingNo,
                'headers': {
                  'Content-Type': 'application/json'
                }
              };
              let response = await requestPromise(options);
              if (response) {
                // stockList = response.body;
                let obj = JSON.parse(response);
                utility.consoleLog(obj.data);
                  updatedCount ++;
              }
        }
        else {
          defer.resolve();
        }
        count++;
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