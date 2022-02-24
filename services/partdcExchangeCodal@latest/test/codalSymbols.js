let {utility} = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let q = require('q');
let us = require('underscore');

/**
 * در این متد با صدا زدن api به روزرسانی در ماشین های dev و prod می توان پایگاه داده آن را به روز کرد.
 * @returns {Promise<*>}
 */
async function updateCodalDB() {
  let defer = q.defer();
  try {
    await init.Initialize();
    let statementsCount = 0;
    // for(let i=201 ; i<= 256 ; i++){
    //   let codalList = await BaseConfig.mongoDBO.collection('CodalStatements').find({},{fields :{ 'data':1}}).skip((256)* 1000).limit(1000).toArray();
    // let symbolList = await BaseConfig.mongoDBO.collection('CodalStatements').find({},{fields:{ '_id' : 0,'data.symbol' : 1}}).toArray();
    // async.eachSeries(symbolList, async (item) => {
    //   try {
    //     item.symbol = item.data.symbol;
    //     await BaseConfig.mongoDBO.collection('codalSymbols').updateOne(
    //       {tracingNo: item.data.symbol},
    //       {
    //         $set:
    //         item
    //       },
    //       {upsert: true});
    //   } catch (e) {
    //     utility.consoleLog(e);
    //   }
    // }, (error) => {
    //   if (error) {
    //     defer.reject(error);
    //     utility.consoleLog('===============================');
    //     utility.consoleLog('Error in innerSeries', error);
    //     utility.consoleLog('===============================');
    //   }
    //   else {
    //     utility.consoleLog('count of statements : ' + statementsCount);
    //     defer.resolve();
    //   }
    // });

    let publisher = await BaseConfig.mongoDBO.collection('publishers').find().toArray();
    let codalList = await BaseConfig.mongoDBO.collection('codalSymbols').find().toArray();
    codalList = us.groupBy(codalList, 'symbol');
    publisher = us.groupBy(publisher, 'displayedSymbol');
    async.eachSeries(codalList, async (item) => {
      try {
        if (publisher[item[0].symbol]) {
          item[0].ISIC = publisher[item[0].symbol][0].isic;
           await BaseConfig.mongoDBO.collection('codalSymbols').updateOne(
            {symbol: item[0].symbol},
            {
              $set:
              item[0]
            },
            {upsert: true});
        }
        else {
          utility.consoleLog(item[0].symbol);
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
        utility.consoleLog('count of statements : ' + statementsCount);
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

updateCodalDB();