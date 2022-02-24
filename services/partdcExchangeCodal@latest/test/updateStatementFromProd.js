let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let q = require('q');
var axios = require('axios');
let rp = require('request-promise');
/**
 * در این متد با صدا زدن api به روزرسانی در ماشین های dev و prod می توان پایگاه داده آن را به روز کرد.
 * @returns {Promise<*>}
 */
async function updateStatementFromProd() {
  let defer = q.defer();
  try {
    await init.initMongoRedis();
    let loop=0;
    let updatedCount = 0;
          try {
            let query = {
              'letterType': 58,
              'date': {
                '$gte': '13950101',
                '$lte': '14000401'
              },
              'data.letterKind': 0,
              'data.symbol' : { '$in' : ['ونوین','وگردش','وکار','وشهر','وسینا','وسالت','وزمین','ورفاه','وخاور','وتجارت','وپست','وپاسار','وپارس','وبملت','وبصادر','وآیند','سمایه','سامان','دی','وملل']},
            };

            //let data = JSON.stringify({"colName": "CodalStatements", "query": query, "projection": {}, "sort": {}});
            let config = {
              method: 'post',
              url: 'http://partfdfexchangecodal-prod.partdp.ir/service/partfdfExchangeCodal@latest/find',
              headers: {
                'Content-Type': 'application/json'
              },
              body: {"colName": "CodalStatements", "query": query, "projection": { "info" : 0}, "sort": {}},
              json:true
            };
            rp(config)
              .then(function (response) {
                let res = response.data.result;
                async.eachSeries(res, async (item) => {
                  delete item._id;
                    let statement = {
                      ...item.data,
                      contentNeed: true,
                      hasInfo: false,
                      type: 'MAR'
                    }
                    let update = await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
                      {tracingNo: item.tracingNo},
                      {$set: statement},
                      {upsert: true});
                    if (update.result.nModified > 0) {
                      updatedCount++;
                    }
                    utility.consoleLog('updateCount ' + updatedCount)
                })
              })
              .catch(function (error) {

                utility.consoleLog(error);
              });

          } catch (e) {
            utility.consoleLog(e);
          }
  } catch (e) {
    utility.consoleLog(e);
    defer.reject(e);
  }
  return defer.promise;
}

// setInterval(updateStatementFromProd, 15000);

updateStatementFromProd();