let utility = require('../utility');
/**
 *@namespace getStockList
 */


let {
  BaseConfig,
  BaseServiceClass
} = require('partdcFramework');
let async = require('async');
let q = require('q');
let moment = require('moment-jalaali');
let env = require('../env');
let us = require('underscore');

/**
 * @class getStockList
 * @extends {BaseServiceClass}
 */
class getStockList extends BaseServiceClass {


  /**
   *Creates an instance of ExampleService.
   * @param {!string} serviceName نام سرويس
   * @param {!string} serviceRedisKey نام منحصر به فرد سرويس جهت ذخيره سازي در رديس و عدم تکراري بودن فرايند اجراي ان
   * @param {object} inputParam پارامترهاي دريافتي از کاربر
   * @param serviceCallMethod
   * @memberof  getStockList
   */
  constructor(serviceName, serviceRedisKey, inputParam, serviceCallMethod) {
    super(serviceName, serviceRedisKey, inputParam, serviceCallMethod);
  }

  /**
   *@description بازنويسي تنظيمات مرتبط با رست
   * @returns {!object} تنظیمات درخواست رست
   * @memberof  getStockList
   */
  getRestRequestOptions() {
    let options = super.getRestRequestOptions();
    options.method = 'GET';
    options.url = env.PARTDCEXCHANGECODAL_URL_STOCKLIST;
    options.rejectUnauthorized = false;
    options.resolveWithFullResponse = true;
    return options;
  }

  /**
   * @description جهت پردازش داده هاي دريافتي متد ذيل مي بايست پياده سازي شود
   * با فراخوانی سرویس سهام لیست نماد ها را دریافت می کنیم
   * @memberof  getStockList
   * @returns {void}
   */
  async processData() {
    let defer = q.defer();
    this.serviceData = this.serviceData.data.result;
    this.publisher_isin = us.groupBy(BaseConfig.publisher, 'isinCode');
    this.publisher_symbol = us.groupBy(BaseConfig.publisher, 'displayedSymbol');
    let symbolList = [];
    let mapNeed = false;
    async.eachSeries(this.serviceData.rows, async (item) => {
      let obj = {
        symbolName: item[0],
        symbolId: item[1],
        flow: item[3],
        marketValue: item[35],
        status: item[40],
        industryName: item[47],
        stockTypeName: item[51],
        industryCode: item[58],
        instrumentID: item[59],
        reciveDate: moment().format('jYYYYjMMjDD HHmmss')
      };
      let symbolIdSearch = BaseConfig.symbolList.find(e => {
        return e.symbolId === obj.symbolId;
      });
      if (symbolIdSearch) {
        obj.symbol = symbolIdSearch.symbol ? symbolIdSearch.symbol : 'NotFound';
        if (obj.symbol === 'NotFound'){
          mapNeed = true;
        }
      }
      else {
        mapNeed = true;
      }
      if (mapNeed){
        obj.symbol = this.mapSymbolName(obj);
        if (obj.symbol !== 'NotFound') {
          let count = obj.symbol.length;
          if (obj.symbol.substring(count-1,count) === ' '){  //وقیام
            obj.symbol = obj.symbol.substring(0,count-1);
          }
          utility.consoleLog('map newSymbol - > ', ' ,symbolName : ' , obj.symbolName, ' -  symbol : ', obj.symbol);
          await this.setStatementsTypeNewSymbol(obj);
        }
        symbolList.push(obj);
      }
      mapNeed = false;
    }, async (error) => {
      if (error) {
        utility.consoleLog('===============================');
        utility.consoleLog('Error in innerSeries', error);
        utility.consoleLog('===============================');
      }
      else {
        this.serviceData = symbolList;
        defer.resolve();
      }
    });
    return defer.promise;
  }

  /**
   *
   * بازنويسي فرايند ذخيره سازي داده
   *
   * اضافه کردن تگ به ليست تگ ها
   * @description
   *  در اين متد دو فرايند قابل بازنويسي است
   * فرايند افزودن تگ ها به ليست تگ ها
   *فرايند ذخيره سازي داده و ارتباط با دي ال اس
   *
   * در صورت بازنويسي حتما خط ذيل نوشته شود
   *
   * this.logSystem.logClass.dlsTags = tags;
   * @memberof  getStockList
   * @returns {void}
   */
  async saveData() {
    let defer = q.defer();
    let data = this.serviceData;
    try {
      if (data) {
        //ذخیره سازی در دیتا بیس
        async.eachSeries(data, async (item) => {
          item.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
          utility.addNewSymbolToLocalVariable(item);
          await BaseConfig.mongoDBO.collection('symbolList').updateOne(
            {symbolId: item.symbolId},
            {$set: item},
            {upsert: true});
        }, async (error) => {
          if (error) {
            utility.consoleLog('===============================');
            utility.consoleLog('Error in innerSeries', error);
            utility.consoleLog('===============================');
          }
          else {
            defer.resolve();
          }
        });
      }
    }
    catch (e) {
      utility.consoleLog(e);
    }
    return defer.promise;
  }

  async setStatementsTypeNewSymbol(newSymbol) {
    let defer = q.defer();
    async.eachSeries(BaseConfig.stmTypes, async (item) => {
      let isSymbolOk = true;
      let type = item.name;
      let symbolConditions = item.symbol;
      let symbolList = item.checkFields[2];
      for (let condition in symbolConditions) {
        if (symbolConditions[condition] !== newSymbol[condition]) {
          isSymbolOk = false;
        }
      }
      if (symbolList && symbolList.symbolList.indexOf(newSymbol.symbol) === -1) {
        isSymbolOk = false;
      }
      if (isSymbolOk) {
        let query = BaseConfig.typeQueries[item.name].stmConditions;
        query.symbol = newSymbol.symbol;
        let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find(query, {fields: {_id: 0}}).toArray();
        if (statements.length)
          for (let stm of statements) {
            stm.type = type;
            if (stm.hasInfo === false && stm.contentNeed === false) {
              utility.consoleLog('Statement Need Info ', ' ,  symbol : ', newSymbol.symbol, ', tracingNo : ', stm.tracingNo, ' type : ' + item.name);
              stm.contentNeed = true;
              utility.addNewStmToLocalVariable(stm);
            }
            await utility.updateDB(stm);
          }
        newSymbol.updateNeed = type;
      }
    }, (error) => {
      if (error) {
        defer.reject(error);
        BaseConfig.partLogger.error('setStatementsTypeNewSymbol', error);
      }
      else {
        defer.resolve(newSymbol);
      }
    });
    return defer.promise;
  }

  mapSymbolName(newSymbol) {
    if (this.publisher_symbol[newSymbol.symbolName]) {
      let element = this.publisher_symbol[newSymbol.symbolName][0];
      return element.displayedSymbol;
    }
    if (this.publisher_isin[newSymbol.instrumentID]) {
      let countMatch = this.publisher_isin[newSymbol.instrumentID].length;
      if(countMatch === 1){
        let element = this.publisher_isin[newSymbol.instrumentID][0];
        return element.displayedSymbol;
      }
      for (let item of  this.publisher_isin[newSymbol.instrumentID]){
        if (item.state !== 3){
          return item.displayedSymbol;
        }
      }
    }
    else return 'NotFound';
  }
}

module.exports = getStockList;