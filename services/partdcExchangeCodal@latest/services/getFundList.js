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
 * @class getStatementsInfoService
 * @extends {BaseServiceClass}
 */
class getFundList extends BaseServiceClass {


  /**
   *Creates an instance of ExampleService.
   * @param {!string} serviceName نام سرويس
   * @param {!string} serviceRedisKey نام منحصر به فرد سرويس جهت ذخيره سازي در رديس و عدم تکراري بودن فرايند اجراي ان
   * @param {object} inputParam پارامترهاي دريافتي از کاربر
   * @param serviceCallMethod
   * @memberof  getStatementsInfoService
   */
  constructor(serviceName, serviceRedisKey, inputParam, serviceCallMethod) {
    super(serviceName, serviceRedisKey, inputParam, serviceCallMethod);
  }

  /**
   *@description بازنويسي تنظيمات مرتبط با رست
   * @returns {!object} تنظیمات درخواست رست
   * @memberof  getStatementsInfoService
   */
  getRestRequestOptions() {
    let options = super.getRestRequestOptions();
    options.method = 'GET';
    options.url = env.PARTDCEXCHANGECODAL_URL_FUNDLIST;
    options.rejectUnauthorized = false;
    options.resolveWithFullResponse = true;
    return options;
  }

  /**
   * @description جهت پردازش داده هاي دريافتي متد ذيل مي بايست پياده سازي شود
   * با فراخوانی سرویس سهام لیست نماد ها را دریافت می کنیم
   * @memberof  getStatementsInfoService
   * @returns {void}
   */
  async processData() {
    let defer = q.defer();
    this.publisher_symbol = us.groupBy(BaseConfig.publisher, 'displayedSymbol');
    this.publisher_nationalId = us.groupBy(BaseConfig.publisher, 'nationalCode');
    this.serviceData = this.serviceData.data.result;
    let fundList = [];
    let mapNeed = false;
    async.eachSeries(this.serviceData, async (item) => {
      let obj = {
        symbolId: item.fundId,
        symbolName: item.fundName,
        shenaseMelli: item.shenaseMelli,
        stockTypeName : 'fund',
        reciveDate : moment().format('jYYYYjMMjDD HHmmss')
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
        if (obj.symbol !== 'NotFound'){
          let count = obj.symbol.length;
          if (obj.symbol.substring(count-1,count) === ' '){
            obj.symbol = obj.symbol.substring(0,count-1);
          }
          utility.consoleLog('map newSymbol - > ', ' ,symbolName : ' , obj.symbolName, ' -  symbol : ', obj.symbol);
          await this.setStatementsTypeNewSymbol(obj);
        }
        fundList.push(obj);
      }
    },async (error) => {
      if (error)  {
        utility.consoleLog('===============================');
        utility.consoleLog('Error in innerSeries', error);
        utility.consoleLog('===============================');
      }
      else{
        this.serviceData = fundList;
        defer.resolve();
      }
    });
    return defer.promise;
  }

  mapSymbolName(newSymbol) {
    newSymbol.shenaseMelli = (newSymbol.shenaseMelli==='140099124755') ? '14009124755' : newSymbol.shenaseMelli;
    newSymbol.shenaseMelli = (newSymbol.shenaseMelli==='4009643926') ?  '14009643926' : newSymbol.shenaseMelli;
    if (this.publisher_nationalId[newSymbol.shenaseMelli]) {
      let countMatch = this.publisher_nationalId[newSymbol.shenaseMelli].length;
      if (countMatch === 1){
        let element = this.publisher_nationalId[newSymbol.shenaseMelli][0];
        return element.displayedSymbol;
      }
      for (let item of  this.publisher_nationalId[newSymbol.shenaseMelli]){
        if (item.state !== 3){
          return item.displayedSymbol;
        }
      }
    }
    if (this.publisher_symbol[newSymbol.symbolName]) {
      let element = this.publisher_symbol[newSymbol.symbolName][0];
      return element.displayedSymbol;
    }
    else return 'NotFound';
  }

  async setStatementsTypeNewSymbol(newSymbol){
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
              utility.consoleLog('Statement Need Info ',' ,  symbol : ' , newSymbol.symbol , ', tracingNo : ' , stm.tracingNo,' type : ' +  item.name );
              stm.contentNeed = true;
              utility.addNewStmToLocalVariable(stm);
            }
            await utility.updateDB(stm);
          }
      }
    }, (error) => {
      if (error) {
        BaseConfig.partLogger.error('setStatementsTypeNewSymbol', error);
      }
    });
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
   * @memberof  getStatementsInfoService
   * @returns {void}
   */
  async saveData() {
    let defer = q.defer();
    let data = this.serviceData;
    try {
      if (data) {
        async.eachSeries(data, async (item) => {
          item.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
          await BaseConfig.mongoDBO.collection('symbolList').updateOne(
            {symbolId: item.symbolId},
            {$set: item},
            {upsert: true});
          BaseConfig.symbolList.push(item);
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
}

module.exports = getFundList;