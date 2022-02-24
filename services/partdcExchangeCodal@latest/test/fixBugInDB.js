let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async/dist/async');

/**
 * در این تابع به علت وجود یک مشکل در دیتابیس هنگام گرفتن جزئیات اطلاعیه ها و ذخیره اشتباه مقدار noInfo برای اطلاعیه ها عمل update را انجام میدهیم.
 * @returns {Promise<void>}
 */
async function  fixBuginDB() {
  await init.Initialize();
  let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find({'hasInfo' : 'noInfo'}).toArray();
  async.eachOfSeries(statements, async (statement, i) => {
    utility.consoleLog(statement.data.contentUri);
    if (statement.data.contentUri && statement.data.contentUri !== '' && statement.hasInfo === 'noInfo') {
      utility.consoleLog('==============================================================');
      utility.consoleLog(`statement ${i + 1} of ${statements.length} Start : `);
      utility.consoleLog('Date : ', statement.tracingNo);
      await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
        {tracingNo: statement.tracingNo},
        {
          $set: {
            hasInfo: false
          }
        });
    }
  });
}
fixBuginDB();