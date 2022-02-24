let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let requestPromise = require('request-promise');
let q = require('q');
let moment = require('moment-jalaali');

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
    let codalStatementsList =  await BaseConfig.mongoDBO.collection('CodalStatements').find({
      "type" : 'IFS_Audited_Orig',
      // date : { "$regex" : "139903"},
      "date" : { "$gte" : "14000801", "$lte" : "14000830"},
      "symbol": {
        "$nin": [
            "ونوین",
            "وگردش",
            "وکار",
            "وشهر",
            "وسینا",
            "وسالت",
            "وزمین",
            "ورفاه",
            "وخاور",
            "وتجارت",
            "وپست",
            "وپاسار",
            "وپارس",
            "وبملت",
            "وبصادر",
            "وآیند",
            "سمایه",
            "سامان",
            "دی",
            "وملل"
          ]
      }
    }).toArray();
    async.eachSeries(codalStatementsList, async (item) => {
      try {
        let info = await BaseConfig.mongoDBO.collection('statementsInfo').findOne({tracingNo : item.tracingNo});
        let lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
        let body = {
          "colName": "CodalStatements",
            "query": {
            "tracingNo": item.tracingNo
          },
          "set": {
            "type" : "IFS_Audited_Orig",
            "contentNeed" : false,
            "hasInfo" : true
          },
          "unset": {
            "y" : ""
          }
        };
          var options = {
            'method': 'POST',
            'url': 'http://partfdfExchangeCodal-dev.partdp.ir/service/partfdfExchangeCodal@latest/updateOne',
            'headers': {
              'Content-Type': 'application/json'
            },
            'body' : JSON.stringify(body)
          };
          let response = await requestPromise(options);
          if (response) {
            let body = {
              "colName": "statementsInfo",
              "query": {
                "tracingNo": item.tracingNo
              },
              "set": {
                info : info,
                lastUpdateDateTime : lastUpdateDateTime
              },
              "unset": {
                "y" : ""
              },
              "upsert" : {"upsert": true}
            };
            var options = {
              'method': 'POST',
              'url': 'http://partfdfExchangeCodal-dev.partdp.ir/service/partfdfExchangeCodal@latest/updateOne',
              'headers': {
                'Content-Type': 'application/json'
              },
              'body' : JSON.stringify(body)
            };
            let response = await requestPromise(options);
            if (response){
              let obj = JSON.parse(response);
              utility.consoleLog(obj.data);
            }
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