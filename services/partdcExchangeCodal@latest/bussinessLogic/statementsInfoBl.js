/**
 * @namespace StatementsInfoBl
 */
let utility = require('../utility');
let {BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig,
  DCManager,
} = require('partdcFramework');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let async = require('async/dist/async');
let ServiceRegister = require('../serviceRegistration/serviceRegister');
let moment = require('moment-jalaali');
let extractInfoFields = require('./extractInfoFields');
let StatementsCalculate = require('./statementsCalculatingBl');
let q = require('q');
let u = require('partUtilities');
let initializer = require('./../initializer');

/**
 * @class StatementsInfoBl
 * @extends {BaseBussinessLogic}
 */
class StatementsInfoBl extends BaseBussinessLogic {

  async getStatementsInfo() {
    try {
      let tracingNoArr = [];
      BaseConfig.statements.forEach((item) => {
        if (item.contentNeed) {
          if (item.hasInfo === false) {
            tracingNoArr.push(item.tracingNo);
          }
        }
      });
      await this.getInfoTracingNoArr(tracingNoArr);
      await new StatementsCalculate().statementsCalculating();
    } catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  async getInfoTracingNoArr(tracingNoArr) {
    let defer = q.defer();
    let statements = [];
    if (tracingNoArr.length) {
      statements = await BaseConfig.mongoDBO.collection('CodalStatements')
        .find({
          tracingNo: {'$in': tracingNoArr}
        }).toArray();
    }
    async.eachOfSeries(statements, async (statement, i) => {
      try {
        utility.consoleLog('==============================================================');
        utility.consoleLog(`statement ${i + 1} of ${statements.length} Start : `);
        utility.consoleLog('Date : ', statement.date);
        utility.consoleLog('get Info -->  symbol :', statement.symbol, ', contentNeed : ', statement.contentNeed, ' , hasInfo : ', statement.hasInfo, ' type : ', statement.type);
        let info;
        info = await this.getInfoService(statement.contentUri, statement.tracingNo);
        if (info) {
          let infoObj = {
            info: info,
            letterType: statement.letterType,
            type: statement.type,
            tracingNo: statement.tracingNo,
            symbol: statement.symbol
          };
          await new extractInfoFields().extractInfo(infoObj);
        }
      } catch (e) {
        utility.consoleLog(e);
      }
    }, (error) => {
      if (error) {
        defer.reject(error);
        BaseException.raiseError(error, 'فرآیند داده گیری ');
      }
      else {
        defer.resolve();
      }
    });
    return defer.promise;
  }

  async getInfoService(contentUri, tracingNo) {
    let serviceClass;
    let serviceRegister = new ServiceRegister();
    // ورودی سرویس دریافت جزعیات لینک جزعیات و شماره پیگیری اططلاعیه میباشد
    let inputParam = {
      contentUri: contentUri,
      tracingNo: tracingNo,
      serviceName: 'getStatementsInfoService',
    };
    serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(inputParam);
    let DC = await new DCManager(inputParam, serviceClass).run();
    let info = await this.checkGetInfo(tracingNo, DC);
    return info;
  }

  async checkGetInfo(tracingNo, DC) {
    if (!DC.statementInfo) {
      if (DC.codalError) {
        let info = DC.codalError;
        await this.handleFailInfo(tracingNo, 'خطا در عملیات درخواست محتوا', DC.codalError);
        let statusCode = info ? (info.StatusCode ? info.StatusCode : info) : 200;
        //به دلیل محدودیت در ارسال تعداد درخواست به سرور رایان بورس در صورتی که تعداد مجاز درخواست ها به پایان رسیده باشد سرویس باید تا پایان روز متوقف گردد بدین منظور در ردیس کلیدی را ست میکنیم که در پایان روز از بین خواهد رفت
        if (statusCode === 403) {
          var todayEnd = new Date().setHours(23, 59, 59, 999);
          BaseConfig.redisClient.set('Error403', new Date());
          BaseConfig.redisClient.expireat('Error403', parseInt(todayEnd / 1000));
          BaseException.raiseError('سرویس تا پایان روز جاری متوقف خواهد بود !!!', 'خطا در عملیات داده گیری');
        }
        else if (statusCode === 401 || statusCode === 404) {
          // در صورت نا معتبر بودن توکن تاکن حذف خواد شد و در اجرای بعدی سرویس فریم ورک داده گیری به خاطر وجود نداشتن توکن ابتدا سعی در دریافت توکن جدید میکند
          await initializer.getTokenRayanBourse();
          BaseException.raiseError('توگن نا معتبر است', 'خطا در عملیات داده گیری');
        }
        else if (statusCode === 500) {
          BaseException.raiseError(DC.error, 'خطا در عملیات داده گیری');
        }
      }
      else {
        let error = JSON.parse(DC.error);
        await this.handleFailInfo(tracingNo, 'خطا در عملیات داده گیری', error.stack);
      }
    }
    else {
      return DC.statementInfo;
    }
  }

  async handleFailInfo(tracingNo, message, description) {
    try {
      utility.consoleLog(' error accursed :', message);
      let date = moment().format('jYYYY/jMM/jDD');
      await BaseConfig.mongoDBO.collection('statementsInfo').remove({tracingNo: tracingNo});
      let item = await BaseConfig.mongoDBO.collection('infoError').find({tracingNo: tracingNo}).toArray();
      if (item.length) {
        if (item[0].count >= 1) {
          utility.consoleLog(' set hasInfo NoInfo ');
          await BaseConfig.mongoDBO.collection('CodalStatements').updateOne({tracingNo: tracingNo},
            {
              $set: {
                contentNeed: true,
                hasInfo: 'noInfo'
              }
            });
          BaseConfig.statements.forEach((item) => {
            if (item.tracingNo === tracingNo) {
              item.contentNeed = true,
                item.hasInfo = 'noInfo';
            }
          });
        }
      }
      utility.consoleLog(' increase error count in infoError ');
      await BaseConfig.mongoDBO.collection('infoError').updateOne(
        {tracingNo: tracingNo},
        {
          $set: {
            error: message,
            date: date,
            description: description
          },
          $inc: {count: 1}
        },
        {upsert: true});

    } catch (e) {
      utility.consoleLog(e);
    }
  }

  async reTryFailInfo(date, tracingNo) {
    try {
      let query = {};
      if (date) {
        query.date = date;
      }
      if (tracingNo) {
        query.tracingNo = +tracingNo;
      }
      let tracingNoInfoError = await BaseConfig.mongoDBO.collection('infoError').find(query).toArray();
      tracingNoInfoError = tracingNoInfoError.map((item) => {
        return item.tracingNo;
      });
      await this.getInfoTracingNoArr(tracingNoInfoError);
    } catch (e) {
      BaseConfig.partLogger.error('reTryFailInfo', e);
    }

  }

  async setStatementsTypeArchive(requestData, type, symbol) {
    let defer = q.defer();
    BaseConfig.partLogger.event('object', 'setStatementsTypeArchive', '    ---------------------    START setStatementsTypeArchive    ---------------------       ');
    try {
      let types = [];
      if (type != null) {
        let typeSelect = BaseConfig.stmTypes.find((item) => {
          return item.name === type;
        });
        types.push(typeSelect);
      }
      else {
        for (let item of BaseConfig.stmTypes) {
          types.push(item);
        }
      }
      async.eachSeries(types, async (item) => {
        let type = item.name;
        let queries = this.getTypeQueries(item, requestData);
        let symbols = [];
        if (!symbol) {
          symbols = await BaseConfig.mongoDBO.collection('symbolList').find(queries.symbolConditions, {symbol: 1}).toArray();
        }
        else {
          symbols.push({symbol: symbol});
        }
        utility.consoleLog(' -- type -- ' + type + ' ---  query --- ');
        utility.consoleLog(queries.stmConditions);
        await this.setTypeSymbolStms(symbols, queries.stmConditions, type);
      }, (error) => {
        if (error) {
          BaseConfig.partLogger.error('setStatementsTypeArchive', error);
          defer.reject(error);
        }
        else {
          BaseConfig.partLogger.event('object', 'setStatementsTypeArchive', '    ---------------------     END setStatementsTypeArchive     ---------------------       ');
          defer.resolve();
        }
      });
    } catch (error) {
      BaseConfig.partLogger.error('getInfoInterimStatements', error);
    }
    return defer.promise;
  }

  getTypeQueries(item, requestData) {
    let today = moment(new Date()).format('jYYYYjMMjDD');
    let startDate = null;
    let endDate = today;
    if (requestData.endDate || requestData.startDate) {
      if (requestData.endDate >= requestData.startDate) {
        startDate = requestData.startDate;
        endDate = requestData.endDate;
      }
      else if (requestData.startDate) {
        startDate = requestData.startDate;
      }
      else if (requestData.endDate) {
        endDate = requestData.endDate;
      }
    }
    let type = item.name;
    if (startDate)
      BaseConfig.typeQueries[type].stmConditions.date['$gte'] = startDate;
    if (endDate)
      BaseConfig.typeQueries[type].stmConditions.date['$lte'] = endDate;
    return BaseConfig.typeQueries[type];
  }

  setTypeSymbolStms(symbols, symbolStmQuery, type) {
    let query = u.cloneObject(symbolStmQuery);
    let defer = q.defer();
    utility.consoleLog('===================== Start =======================');
    async.eachSeries(symbols, async (item) => {
      query['symbol'] = item.symbol;
      let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find(query, {fields: {_id: 0}}).toArray();
      if (statements.length)
        utility.consoleLog('symbol : ', item.symbol, ' -- statements count : ', statements.length);
      for (let stm of statements) {
        stm.type = type;
        if (stm.contentNeed === false && stm.hasInfo === false) {
          stm.contentNeed = true;
          utility.consoleLog('Statement Need Info ', 'date : , ', stm.date, ', symbol : ', stm.symbol, ', tracingNo : ', stm.tracingNo);
          this.addNewStmToLocalVariable(stm);
        }
        await this.updateDB(stm);
      }
    }, (error) => {
      if (error) {
        BaseConfig.partLogger.error('setStatementsTypeArchive', error);
        defer.reject(error);
      }
      else {
        utility.consoleLog('===================== End =======================');
        defer.resolve();
      }
    });
    return defer.promise;
  }

  addNewStmToLocalVariable(newStm) {
    let statement = BaseConfig.statements.find((item) => {
      return item.tracingNo === newStm.tracingNo;
    });
    if (statement) {
      statement.symbol = newStm.symbol;
      statement.tracingNo = newStm.tracingNo;
      statement.contentNeed = newStm.contentNeed;
      statement.type = newStm.type;
      statement.hasInfo = newStm.hasInfo;
    }
    else {
      let obj = {
        symbol: newStm.symbol,
        tracingNo: newStm.tracingNo,
        contentNeed: newStm.contentNeed,
        type: newStm.type,
        hasInfo: newStm.hasInfo
      };
      BaseConfig.statements.push(obj);
    }
  }

  async updateDB(stm) {
    await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
      {tracingNo: stm.tracingNo},
      {$set: stm},
      {upsert: true});
  }
}

module.exports = StatementsInfoBl;
