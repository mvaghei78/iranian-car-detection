let utility = require('../utility');
let {
  BaseConfig
} = require('partdcFramework');
require('../initDotEnv');
let q = require('q');
let async = require('async');
let Initializer = require('../initializer');
let moment = require('moment-jalaali');
let rp = require('request-promise');

/**
 *
 * @param i
 * @returns {Promise<void>}
 */
async function countStatements(date) {
  let query = {
    "data.publishDateTime" : {
      "$gte" :  date + " 14:00:00",
      "$lte" :  date + " 17:00:00"
  }
    // "date" : date.replaceAll('/','')
  }
  let count = 0;
  let config = {
    method: 'post',
    url: 'http://partfdfexchangecodal-prod.partdp.ir/service/partfdfExchangeCodal@latest/count',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {"colName": "CodalStatements", "query": query, "projection": {}, "sort": {}},
    json:true
  };

  rp(config)
    .then(async function (response) {
      count = response.data.result;
      await BaseConfig.mongoDBO.collection('analyseDate').updateOne(
        {date: date},
        {$set: { count_14_17 : count}},
        {upsert: true});
      utility.consoleLog(`in ${date} count : ${count} `);
    })
    .catch(function (error) {
      utility.consoleLog('==========================================' , error);
      //utility.consoleLog(error);
    });

}



function generateDates(startDate, endDate) {
  let queryParams = [];
  let now = new Date(moment(endDate, 'jYYYYjMMjDD').toDate());
  for (let d = new Date(moment(startDate, 'jYYYYjMMjDD').toDate()); d <= now; d.setDate(d.getDate() + 1)) {
    let grgDateArray = moment(d).format('jYYYY/jMM/jDD');
    // let date = {
    //   year: parseInt(grgDateArray[0].trim()),
    //   month: parseInt(grgDateArray[1].trim()),
    //   day: parseInt(grgDateArray[2].trim()),
    // };
    queryParams.push(grgDateArray);
  }
  return queryParams;
}

/**
 *
 * @returns {Promise<void>}
 */
async function start() {
  await Initializer.Initialize([1]);

  let list = generateDates('13990601','14000101');
  async.forEach(list,async (item)=> {
    await countStatements(item);
  })

}
start();


