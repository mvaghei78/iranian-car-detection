/**
 * @namespace BasicPreparationsBl
 */
let {BaseConfig} = require('partdcFramework');
let {BaseBussinessLogic, BaseException} = require('partServiceScaffoldModule');
let utility = require('../utility');
let async = require('async');
let q = require('q');
let rp = require('request-promise');
let moment = require('moment-jalaali');

/**
 * @class BasicPreparationsBl
 * @summary کلاس لایه بیزینس مانیتورینگ
 * @memberOf BasicPreparationsBl
 * @description
 *
 @extends BaseBussinessLogic
 */
class BasicPreparationsBl extends BaseBussinessLogic {

  //TODO بررسی شود چرا در حالت ارشیو تاریخ انتهایی پریروز است
  async getCountsStatementsDB(startDate) {
    let defer = q.defer();
    try {
      let lastDateInDB = await this.getLastDateInDB('countDB');
      let firstDate = startDate ? startDate : lastDateInDB;
      firstDate = firstDate ? firstDate : '13860709';
      let currentDate = new Date();
      let yesterday = currentDate.setDate(currentDate.getDate() - 1);
      yesterday = moment(new Date(yesterday)).format('jYYYYjMMjDD');
      let daysArray = this.generateDates(firstDate, yesterday);
      let array = [];
      async.eachSeries(daysArray,async (date) => {
        try{
          let statementsDates = await BaseConfig.mongoDBO.collection('CodalStatements').count({date : date.replaceAll('/','')});
          let obj = {};
          obj.date = date;
          obj.countDB = statementsDates;
          array.push(obj);
        }
        catch (e) {
          console.log(e , '--------------> error in get countDB for date : ',date);
        }
      },async (err) => {
        if (err) {
          defer.reject(false);
        }
        else{
          await this.insertToDB(array);
          BaseConfig.partLogger.event('object', 'getStmCountDB', ' End Get All statements Count From DB Successfully');
          defer.resolve(true);
        }
      });
    }
    catch (e) {
      utility.consoleLog(e, 'getCountsStatementsDB', 'can not get statements countDB');
    }
    return  defer.promise;
  }

  async getStatementsCountCodal360(datesRangeArray) {
    try {
      let firstDate = await this.getLastDateInDB('codalCount');
      let startDate = firstDate ? firstDate : '13860709';
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday = moment(new Date(yesterday)).format('jYYYYjMMjDD');
      let datesArray = this.generateDates(startDate, yesterday);
      datesArray = datesRangeArray ? datesRangeArray.length ? datesRangeArray : datesArray : datesArray;
      async.eachLimit(datesArray, 10, async (date) => {
        await this.getStatementCount(date);
      }, async () => {
        await this.retryFailDays();
      });
    }
    catch (error) {
      BaseException.raiseError(error, 'خطا');
    }
  }

  async getLastDateInDB(item) {
    let query = {};
    query[item] = {$nin: [null]};
    let items = await BaseConfig.mongoDBO.collection('statementsCount').find(query).sort({'date': -1}).toArray();
    if (items.length) {
      return items[0].date.replaceAll('/', '');
    }
    else {
      return null;
    }
  }

  async retryFailDays() {
    BaseConfig.partLogger.event('object', 'getStmCountCodal360', ' Retry Fail Days  ');
    let incompleteDates = await BaseConfig.mongoDBO.collection('statementsCount').find({'codalCount': {$in: [null]}}, {
      fields: {
        '_id': 0,
        'date': 1
      }
    }).toArray();
    incompleteDates = incompleteDates.map((item) => {
      return item.date;
    });
    if (incompleteDates.length)
      await this.getStatementsCountCodal360(incompleteDates);
    else
      BaseConfig.partLogger.event('object', 'getStmCountCodal360', ' End Get All days From Codal360 Successfully');

  }

  generateDates(startDate, endDate) {
    let queryParams = [];
    let now = new Date(moment(endDate, 'jYYYYjMMjDD').toDate());
    for (let d = new Date(moment(startDate, 'jYYYYjMMjDD').toDate()); d <= now; d.setDate(d.getDate() + 1)) {
      let date = moment(d).format('jYYYY/jMM/jDD');
      queryParams.push(date);
    }
    return queryParams;
  }

  async getStatementCount(date) {
    let result = [];
    try {
      let serviceResult = false;
      while (!serviceResult) {
        let response = await this.sendReuestCodal360(date);
        serviceResult = response.done;
        result.push(response.result);
      }
    }
    catch (error) {
      result = error.result;
    }
    await this.insertToDB(result);
  }

  async sendReuestCodal360(day) {
    let defer = q.defer();
    let currentDate = day.split('/');
    currentDate = currentDate[0] + '%2F' + currentDate[1] + '%2F' + currentDate[2];
    let config = {
      method: 'GET',
      url: 'https://search.codal.ir/api/search/v2/q?FromDate=' + currentDate + '&ToDate=' + currentDate,
      headers: {
        'Cookie': 'BIGipServersearch.codal.ir.app~search.codal.ir_pool=1076170924.20480.0000; usrInfo=uInfo=X+cIM2vigSIF4o5OghJhi39RbIEQQQaQQQq1e98SZQilmgz47XLOP+PvzZPq6ejXmhtXNFgxH+GopBrxZ8tewpxaBoyZ6FOsLg1PWJiwso0DCMsuZRV4Lvi4dPkX7qFfvtigg6; TS0154d277=01f9930bd2221c4bea2b17c6f6b2e2611dc310a38c65797fab8023c6896caed4729673d860010293f0508c783effa4405f0451fbf05b6f72eb45984e6553a3422802af4607; TS018fb0f7=01f9930bd247172313edd640ada68b463554d760389a7d2d63527ee2041eb74206d8a6fde3fe247b33eb87d2a37c3dc50bbfad5ffef7d098b16aab2ff95707207647cd276b',
      },
      rejectUnauthorized: false,
    };
    let response = await rp(config);
    if (response) {
      BaseConfig.partLogger.event('object', 'getStmCountCodal360', ' ' + day);
      let res = JSON.parse(response);
      let totalCount = res.Total;
      let oneDayObj = {
        date: day,
        codalCount: totalCount
      };
      defer.resolve({done: true, result: oneDayObj});
    }
    else {
      let oneDayObj = {
        date: day,
        codalCount: null
      };
      defer.reject({done: false, result: oneDayObj});
    }
    return defer.promise;
  }

  async insertToDB(array) {
    let defer = q.defer();
    try {
      //ذخیره سازی در دیتا بیس
      async.eachSeries(array, async (item) => {
        await BaseConfig.mongoDBO.collection('statementsCount').updateOne(
          {date: item.date},
          {$set: item},
          {upsert: true});
      }, (error) => {
        if (error) {
          BaseException.raiseError(error, 'خطا');
        }
        else
          defer.resolve();
      });
    }
    catch (error) {
      BaseException.raiseError(error, 'خطا');
    }
    return defer.promise;
  }

  async extractDataFromStatements() {
    try {
      let stmArray = [];
      let type;
      let count1 = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        hasInfo: {'$nin': [true]},
        data: {'$nin': [null]}
      }).sort({date: -1}).count();
      let count2 = count1;
      do {
        count1 = count2;
        BaseConfig.partLogger.event('object', 'extractDataFromStm', ' ' + count1);
        let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find({
          hasInfo: {'$nin': [true]},
          data: {'$nin': [null]}
        }).sort({date: -1}).limit(300).toArray();
        for (let statement of statements) {
          type = statement.type;
          statement = {
            ...statement,
            ...statement.data,
            contentNeed: false,
            type : statement.type
          };
          if (type === 'EPS') statement.type = 'IFS_NotAudited_Orig';
          statement = utility.createStatementObj(statement);
          stmArray.push(statement);
        }
        await this.updateStm(stmArray);
        stmArray = [];
        count2 = await BaseConfig.mongoDBO.collection('CodalStatements').find({
          hasInfo: {'$nin': [true]},
          data: {'$nin': [null]}
        }).sort({date: -1}).count();
      } while (count1 !== count2);
    }
    catch (error) {
      BaseException.raiseError(error, 'خطا');
    }
  }

  async separatingInfoFromStatements() {
    try {
      let infoArray = [];
      let stmArray = [];
      let type;
      let count1 = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        hasInfo: true,
        info: {'$nin': [null]}
      }).sort({date: -1}).count();
      let count2 = count1;
      do {
        count1 = count2;
        BaseConfig.partLogger.event('object', 'separatingInfoFromStm', ' ' + count1);
        let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find({
          hasInfo: true,
          info: {'$nin': [null]}
        }).sort({date: -1}).limit(1000).toArray();
        for (let statement of statements) {
          let obj = {tracingNo: statement.tracingNo, info: statement.info};
          type = statement.type;
          statement = {
            ...statement,
            ...statement.data,
            contentNeed: false,
            type : type
          };
          if (type === 'EPS') statement.type = 'IFS_NotAudited_Orig';
          statement = utility.createStatementObj(statement);
          infoArray.push(obj);
          stmArray.push(statement);
        }
        await this.updateStm(stmArray);
        await this.insertInfo(infoArray);
        infoArray = [];
        stmArray = [];
        count2 = await BaseConfig.mongoDBO.collection('CodalStatements').find({
          hasInfo: true,
          info: {'$nin': [null]}
        }).sort({date: -1}).count();
      }
      while (count1 !== count2);
    }
    catch (error) {
      BaseException.raiseError(error, 'خطا');
    }
  }

  async updateStm(stmArray){
    let defer = q.defer();
    async.eachOfSeries(stmArray, async (statement) => {
      try{
        await BaseConfig.mongoDBO.collection('CodalStatements').updateOne({tracingNo: statement.tracingNo},
          {
            $set: statement,
            $unset: {data: '',info : ''}
          },
          {upsert: true});
      }
      catch (e) {
        defer.reject(false);
      }
    }, (err) => {
      if (err) {
        defer.reject(false);
      }
      else
        defer.resolve(true);
    });
    return defer.promise;
  }

  async insertInfo(infoArray){
    let defer = q.defer();

    async.eachOfSeries(infoArray, async (obj) => {
      try{
        obj.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
        obj.insertDateTime =  moment().format('jYYYY/jMM/jDD HH:mm:ss');
        await BaseConfig.mongoDBO.collection('statementsInfo').updateOne(
          {tracingNo: obj.tracingNo},
          {
            $setOnInsert : obj
          },
          {upsert: true});
      }
      catch (e) {
        defer.reject(false);
      }
    }, (err) => {
      if (err) {
        defer.reject(false);
      }
      else
        defer.resolve(true);
    });
    return defer.promise;
  }
}

module.exports = BasicPreparationsBl;