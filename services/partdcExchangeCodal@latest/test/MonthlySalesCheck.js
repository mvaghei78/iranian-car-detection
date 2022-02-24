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
    let productAndSalesCount = 0;
    let productAndSalesfieldsItemsCount = 0;
    let count = 1;
    let statementsCount = 0;
    let newBrands = [];
    let result = await BaseConfig.mongoDBO.collection('brands').aggregate(
      [ {$match:{
          country :"iran"}
      },
        {
          $project : {
            name: "$name",
            totalAmount: { $sum: [ "$tehran-province", "$khorasan-razavi-province","$isfahan-province" ,"$azarbaijan-east-province" ,"$alborz-province","$fars-province","$azerbaijan-west-province" , "$khuzestan-province","$mazandaran-province" , "$kerman-province" , "$sistan-and-baluchestan-province" ,"$gilan-province" ,"$khorasan-south-province","$hormozgan-province" ,"$bushehr-province" ] }
          }
        }
      ]).toArray();
    // let brands = await BaseConfig.mongoDBO.collection('brands').find({}).toArray();
    async.eachSeries(result, async (item) => {
      try {
        let obj = {};
        obj.totalAmount = item.totalAmount;
        count++;
        await BaseConfig.mongoDBO.collection('brands').updateOne({
          name : item.name
        },{ "$set" : {
          "totalCount" : item.totalAmount
          }});
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