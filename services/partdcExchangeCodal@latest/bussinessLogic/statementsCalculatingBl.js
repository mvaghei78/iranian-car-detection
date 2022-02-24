/**
 *@namespace statementsCalculatingBl
 */
let {BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig,
} = require('partdcFramework');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let async = require('async/dist/async');
let moment = require('moment-jalaali');
let q = require('q');
let CalculatingMethods = require('./calculatingMethods');
let calculatingMethods = new CalculatingMethods();

/**
 * @class statementsCalculatingBl
 * @extends {BaseBussinessLogic}
 */
class statementsCalculatingBl extends BaseBussinessLogic {

  async statementsCalculating() {
    let defer = q.defer();
    try {
      let calculateSymbolsArr = [];
      BaseConfig.symbolList.forEach((item) => {
        if (item.updateNeed)
          calculateSymbolsArr.push(item);
      });
      let i = 1;
      async.eachSeries(calculateSymbolsArr, async (symbolObj) => {
        BaseConfig.partLogger.event('object', 'calculateSymbol', `symbol ${i} of ${calculateSymbolsArr.length} Start : ` + symbolObj.symbol);
        let funcsList = BaseConfig.typeQueries[symbolObj.updateNeed].calculating;
        await this.calculateSymbol(funcsList, symbolObj);
        symbolObj.updateNeed = null;
        await this.updateDB(symbolObj);
        await this.updateLV(symbolObj);
        // BaseConfig.partLogger.event('object', 'calculateSymbol', `symbol ${i} of ${calculateSymbolsArr.length} End : ` + symbolObj.symbol);
        i = i + 1;
      }, (error) => {
        if (error) {
          defer.reject(error);
        }
        else {
          defer.resolve(true);

        }
      });
    } catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
    return defer.promise;
  }

  async calculateSymbol(funcList, symbolObj) {
    let defer = q.defer();
    async.each(funcList, async (funcName) => {
      await this.callRelatedCalculating(funcName, symbolObj);
    }, (error) => {
      if (error) {
        defer.reject(error);
      }
      else {
        defer.resolve(true);
      }
    });
    return defer.promise;
  }

  async callRelatedCalculating(funcName, symbolObj) {
    if (funcName === 'PToS') {
      symbolObj.sumOperatingIncome = await calculatingMethods.calculatePTOS(symbolObj);
    }
    if (funcName === 'PToB') {
      symbolObj.stockHoldersEquity = await calculatingMethods.calculatePToB(symbolObj);
    }
    if (funcName === 'ROA') {
      symbolObj.ROA = await calculatingMethods.calculateROA(symbolObj);
    }
    if (funcName === 'ROE') {
      symbolObj.ROE = await calculatingMethods.calculateROE(symbolObj);
    }
    if (funcName === 'EPS') {
      symbolObj.EPS = await calculatingMethods.calculateEPS(symbolObj);
    }
    if (funcName === 'CurrentRatio') {
      symbolObj.CurrentRatio = await calculatingMethods.calculateCurrentRatio(symbolObj);
    }
    if (funcName === 'QuickRatio') {
      symbolObj.QuickRatio = await calculatingMethods.calculateQuickRatio(symbolObj);
    }
    if (funcName === 'CashRatio') {
      symbolObj.CashRatio = await calculatingMethods.calculateCashRatio(symbolObj);
    }
    if (funcName === 'DebtRatio') {
      symbolObj.DebtRatio = await calculatingMethods.calculateDebtRatio(symbolObj);
    }
  }

  async updateDB(symbolObj) {
    try {
      symbolObj.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
      await BaseConfig.mongoDBO.collection('symbolList').updateOne(
        {symbolId: symbolObj.symbolId},
        {$set: symbolObj},
        {upsert: true});
    } catch (error) {
      BaseConfig.partLogger.error('saveSymbolList', error);
    }
  }

  updateLV(symbolObj) {
    BaseConfig.symbolList.forEach((item) => {
      if (item.symbolId === symbolObj.symbolId) {
        item.updateNeed = symbolObj.updateNeed;
      }
    });
  }

  async symbolCalculatingArchive(requestData, type, funcNames) {
    try {
      let defer = q.defer();
      let types = [];
      for (let item of BaseConfig.stmTypes) {
        if (type && item.name === type)
          types.push(item);
      }
      let funcNamesList = (funcNames + '').split(',');
      async.eachSeries(types, async (item) => {
        try {
          let type = item.name;
          if (item.calculating) {
            let symbolConditions = item.symbol;
            if (requestData.symbol) {
              symbolConditions.symbol = requestData.symbol;
            }
            else {
              symbolConditions.symbol = {
                '$nin': ['NotFound']
              };
            }
            let symbolList = await BaseConfig.mongoDBO.collection('symbolList').find(symbolConditions, {fields: {_id: 0}}).toArray();
            let i = 1;
            async.eachSeries(symbolList, async (symbolObj) => {
              try {
                BaseConfig.partLogger.event('object', 'calculateSymbol', `symbol ${i} of ${symbolList.length} Start : ` + symbolObj.symbol);
                symbolObj.updateNeed = type;
                await this.calculateSymbol(funcNamesList, symbolObj);
                symbolObj.updateNeed = null;
                await this.updateDB(symbolObj);
                await this.updateLV(symbolObj);
                i = i + 1;
              } catch (e) {
                console.log(e);
              }
            }, (error) => {
              if (error) {
                defer.reject(error);
              }
              defer.resolve();
            });
          }
        } catch (e) {
          console.log(e);
        }
      }, (error) => {
        if (error) {
          defer.reject(error);
          BaseConfig.partLogger.error('setStatementsTypeNewSymbol', error);
        }
        else {
          defer.resolve();
        }
      });
      return defer.promise;
    } catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }
}

module.exports = statementsCalculatingBl;