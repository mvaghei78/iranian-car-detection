let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let q = require('q');

/**
 * در این متد با صدا زدن api به روزرسانی در ماشین های dev و prod می توان پایگاه داده آن را به روز کرد.
 * @returns {Promise<*>}
 */
async function updateCodalDB() {
  let defer = q.defer();
  try {
    await init.Initialize();
    let symbolList = await BaseConfig.mongoDBO.collection('symbolList').find({
      'industryCode': {
        $exists: true,
        $nin: ['65', '56', '58', '70']
      }
    }).toArray();
    async.eachSeries(symbolList, async (item) => {
      try {
        let res = await BaseConfig.mongoDBO.collection('operatingIncome').find({
          'sumOperatingIncome': 0,
          'symbol': item.symbol,
          'lastPeriod.value' : 0
        }).toArray();
        if (res.length === 0){
          utility.consoleLog(item)
        }
      } catch (e) {
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
        defer.resolve();
      }
    });
  } catch (e) {
    utility.consoleLog(e);
    defer.reject(e);
  }
  return defer.promise;
}

updateCodalDB();
