let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let q = require('q');
let us = require('underscore');
let moment = require('moment-jalaali');

/**
 * در این متد با صدا زدن api به روزرسانی در ماشین های dev و prod می توان پایگاه داده آن را به روز کرد.
 * @returns {Promise<*>}
 */
async function updateCodalDB() {
  await init.initMongoRedis();

  let defer = q.defer();
  try {
    let notAudited = [];
    let MAR_banks = [];
    let errorMAR_banks = [];
    let errorMatchNotAudited = [];
    let notFound = [];
    let list = await BaseConfig.mongoDBO.collection('CodalStatements').find({
      'contentNeed': true,
    }).toArray();
    let symbolList = await BaseConfig.mongoDBO.collection('statementsInfo').find({},{fields : { info : 0}}).toArray();
    async.eachSeries(symbolList, async (item) => {
      try {
        let statement =   await BaseConfig.mongoDBO.collection('CodalStatements').find(
          {
            tracingNo: item.tracingNo
          }).toArray();
        if (statement.length) {
          statement = statement[0];
          let obj = {
            tracingNo: statement.tracingNo,
            date: statement.date,
            hasInfo: statement.hasInfo,
            contentNeed: statement.contentNeed,
            type: statement.type
          };
          // console.log('tracingNo : ', statement.tracingNo, ' date :', statement.date, ' contentNeed : ' , statement.contentNeed , 'hasInfo:', statement.hasInfo, ' ,type ', statement.type);
          if (statement.hasInfo === true) {
            // if (statement.type === 'IFS_Audited_Orig') {
              MAR_banks.push(obj);
            // }
          }
          else {
            console.log('tracingNo : ', statement.tracingNo, ' date :', statement.date, ' contentNeed : ' , statement.contentNeed , 'hasInfo:', statement.hasInfo, ' ,type ', statement.type);
            // if (statement.type === 'IFS_Audited_Orig' || statement.type === 'IFS_NotAudited_Orig') {
              await updateStm(statement.tracingNo)
            // }
              errorMAR_banks.push(obj);
            // }
          }
        }
        else {
          console.log(item.tracingNo);
          notFound.push(item.tracingNo);
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
        console.log('length errorMatchNotAudited : ' ,errorMAR_banks.length)
        // console.log('length errorMatchAudited : ' ,errorMatchAudited.length)
        // console.log('length notAudited : ' , notAudited.length)
        console.log('length has type : ' , MAR_banks.length)
        console.log('length notFound : ' , notFound.length)
        defer.resolve();
      }
    });
    // }
  } catch (e) {
    utility.consoleLog(e);
    defer.reject(e);
  }
  return defer.promise;
}

async function updateStm(tracingNo) {
  await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
    {tracingNo: tracingNo},
    {
      $set: {
        hasInfo: true
      }
    },
    {upsert: true});
}

updateCodalDB();