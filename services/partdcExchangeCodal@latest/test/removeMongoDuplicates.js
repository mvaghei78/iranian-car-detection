let utility = require('../utility');
let {
  BaseConfig
} = require('partdcFramework');
require('../initDotEnv');
let q = require('q');
let async = require('async');
let Initializer = require('../initializer');

/**
 *
 * @param i
 * @returns {Promise<void>}
 */
async function remove(i) {
  let mongo = (await BaseConfig.mongoDBO.collection('CodalStatements')
    .aggregate(
      {'$group' : { '_id': '$tracingNo', 'count': { '$sum': 1 } } },
      {'$match': {'_id' :{ '$ne' : null } , 'count' : {'$gt': 1} } },
      {'$project': {'tracingNo' : '$_id', '_id' : 0} }
    ).toArray()).map(item=>{
    return item._id;
  });
  utility.consoleLog(mongo.length)
  if (mongo.length>0){
    await removeFromMongo(mongo);
    utility.consoleLog(`step ${i} finished`);
    utility.consoleLog('==========================================');
    await remove(++i);

  }
  else{
    utility.consoleLog('\n\n');
    utility.consoleLog('==========================================');
    utility.consoleLog('all duplicate records remove from mongo');
    utility.consoleLog('==========================================');
    process.exit(1);
  }

}

/**
 *
 * @param list
 * @returns {Promise<*>}
 */
async function removeFromMongo(list) {
  let defer =q.defer();
  async.eachSeries(list,async(tr)=>{
    var item =await BaseConfig.mongoDBO.collection('CodalStatements').findOne({tracingNo:tr});
    await BaseConfig.mongoDBO.collection('CodalStatements').remove({_id: item._id});
  },e=>{
    defer.resolve();
  });
  return defer.promise;

}

/**
 *
 * @returns {Promise<void>}
 */
async function start() {
  await Initializer.initMongoRedis();
  await remove(0);

}
start();


