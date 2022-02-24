let {BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig,
  DCManager,
} = require('partdcFramework');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let ServiceRegister = require('../serviceRegistration/serviceRegister');
let async = require('async');
let utility = require('../utility');
let q = require('q');

/**
 * @class SymbolListBl
 * @memberOf SymbolListBl
 * @description فراخوانی سرویس ها
 */
class SymbolListBl extends BaseBussinessLogic {
  /**
   * @description دریافت لیست کلیه ی نماد های بورسی با درخواست به api های سهام
   * @returns {void}
   * @memberOf  SymbolListBl
   */
  async getStockList() {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceClass;
      let serviceModel = {};
      //سرویس دریافت عنوان نوع اطلاعیه ها
      serviceModel.serviceName = 'getStockList';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      let DC = await new DCManager(serviceModel, serviceClass).run();
      if (!DC.saveDone) {
        BaseException.raiseError(DC.error.message, 'فرآیند داده گیری ');
      }
    }
    catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  /**
   * @description دریافت لیست نماد های صندوق
   * @returns {void}
   * @memberOf  SymbolListBl
   */
  async getFundList() {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceClass;
      let serviceModel = {};
      //سرویس دریافت عنوان نوع اطلاعیه ها
      serviceModel.serviceName = 'getFundList';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      let DC = await new DCManager(serviceModel, serviceClass).run();
      if (!DC.saveDone) {
        BaseException.raiseError(DC.error.message, 'فرآیند داده گیری ');
      }
    }
    catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  async updateSymbol(symbolId, symbol) {
    try {
      let res = await BaseConfig.mongoDBO.collection('symbolList').find({
        symbolId,
        symbol
      }).toArray();
      if (res.length)
        return this.successResult('نام نماد قبلا ثبت شده است.', 'fail');
      res = await BaseConfig.mongoDBO.collection('symbolList').updateOne({symbolId}, {
        $set: {
          symbol
        }
      });
      if (res.modifiedCount){
        let newSymbol = await BaseConfig.mongoDBO.collection('symbolList').find({ symbolId :symbolId}).toArray();
        newSymbol = await this.setStatementsTypeNewSymbol(newSymbol[0]);
        utility.addNewSymbolToLocalVariable(newSymbol);
        return this.successResult('نام نماد مورد نظر با موفقیت ویرایش گردید', 'success');
      }
      return this.successResult('مشکل در ویرایش نام. لطفا مجددا تلاش نمایید', 'faile');
    }
    catch (error) {
      BaseException.raiseError(error, 'خطا در اجرای درخوست');
    }
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

}

module.exports = SymbolListBl;
