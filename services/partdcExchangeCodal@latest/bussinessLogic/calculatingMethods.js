/**
 * @namespace CalculatingMethods
 */
let {
  BaseConfig,
} = require('partdcFramework');
let moment = require('moment-jalaali');
let u = require('partUtilities');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let us = require('underscore');
let async = require('async/dist/async');
let q = require('q');
let utility = require('../utility');

class CalculatingMethods extends BaseBussinessLogic {

  // بازگردانی جمع درآمد عملیاتی به صورت سالانه
  async calculatePTOS(symbol) {
    let sumOperatingIncome = null;
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/jMM/jDD');
      // اطلاعیه های تلفیقی و غیر تلفیقی
      let allStatements = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'periodEndToDate': { $gte: twoYearsAgo },
        'hasInfo': true
      }).sort({ 'periodEndToDate': -1 }).toArray();
      if (allStatements.length > 0) {
        sumOperatingIncome = await this.fetchOperatingIncomeValue(allStatements);
        sumOperatingIncome = sumOperatingIncome ? sumOperatingIncome.toString().length >= 10 ? sumOperatingIncome : sumOperatingIncome * Math.pow(10, 6) : null;
      }
      return sumOperatingIncome;
    } catch (error) {
      BaseConfig.partLogger.error('CalculatePTOS', error);
    }
  }

  async fetchOperatingIncomeValue(allStatements) {
    let res = utility.groupByPdate(allStatements);
    allStatements = res.allStatements;
    let statementsObj = res.statementsObj;
    let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
    let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
    let samePeriod = null;  // اطلاعیه مرتبط با دوره ی مشابه در سال قبل
    let sumOperatingIncome = null;
    let lastStm = allStatements.length ? allStatements[0] : null;
    lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
    lastPeriod = lastPeriod.ProfitAndLoss;
    if (lastStm.period === 12) {
      sumOperatingIncome = lastPeriod ? lastPeriod.column_1.fields.operatingIncome !== null ? lastPeriod.column_1.fields.operatingIncome : null : null;
      return sumOperatingIncome;
    }
    else if (lastPeriod) {
      let yearlyPeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), lastPeriod.column_1.period).replaceAll('/', '').substring(0, 6);  // اخرین اطلاعیه با دوره 12 ماهه
      let samePeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), 12).replaceAll('/', '').substring(0, 6);   //1 سال قبل از اخرین دوره
      if (statementsObj[yearlyPeriodDate]) {
        let obj = statementsObj[yearlyPeriodDate][0];
        yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
        yearlyPeriod = yearlyPeriod ? yearlyPeriod.ProfitAndLoss ? yearlyPeriod.ProfitAndLoss.column_1 : null : null;
      }
      if (statementsObj[samePeriodDate]) {
        let obj = statementsObj[samePeriodDate][0];
        samePeriod = await this.fetchInfoFields(obj.tracingNo);
        samePeriod = samePeriod ? samePeriod.ProfitAndLoss ? samePeriod.ProfitAndLoss.column_1 : null : null;
      }
      if (!yearlyPeriod) {
        yearlyPeriod = lastPeriod.column_3 ? lastPeriod.column_3 : null;
      }
      if (!samePeriod) {
        samePeriod = lastPeriod.column_2;
      }
      if (lastPeriod && yearlyPeriod && samePeriod) {
        sumOperatingIncome = lastPeriod.column_1.fields.operatingIncome !== null && yearlyPeriod.fields.operatingIncome !== null && samePeriod.fields.operatingIncome !== null ? lastPeriod.column_1.fields.operatingIncome + yearlyPeriod.fields.operatingIncome - samePeriod.fields.operatingIncome : 0;
      }
    }
    return sumOperatingIncome;
  }

  //بازگردانی اخرین مقدار جمع حقوق مالکانه از اطلاعیه
  async calculatePToB(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/jMM/jDD');
      let stockHoldersEquity = null;
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'periodEndToDate': { $gte: twoYearsAgo },
        'hasInfo': true
      }).sort({ 'periodEndToDate': -1 }).limit(3).toArray();
      if (mongoData.length > 0) {
        stockHoldersEquity = await this.fetchStockHoldersEquityValue(mongoData, symbol);
        stockHoldersEquity = stockHoldersEquity ? stockHoldersEquity.toString().length >= 10 ? stockHoldersEquity : stockHoldersEquity * Math.pow(10, 6) : null;
        return stockHoldersEquity;
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculatePToB', error);
    }
  }

  async fetchStockHoldersEquityValue(inputArr) {
    let defer = q.defer();
    let stockHoldersEquity = null;
    async.eachOfSeries(inputArr, async (stm) => {
      try {
        if (!stockHoldersEquity) {
          let obj = await this.fetchInfoFields(stm.tracingNo);
          stockHoldersEquity = obj.BalanceSheet ? obj.BalanceSheet.column_1.fields.stockHoldersEquity ? obj.BalanceSheet.column_1.fields.stockHoldersEquity : null : null;
        }
      } catch (e) {
        console.log(e);
      }
    }, (error) => {
      if (error) {
        defer.reject(error);
      }
      else {
        defer.resolve(stockHoldersEquity);
      }
    });
    return defer.promise;
  }

  //سود(زیان) خالص (یا همان درآمد خالص) تقسیم بر جمع کل داراییها --> به صورت سالانه
  async calculateROA(symbol) {
    let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/jMM/jDD');
    let totalAssets;  //totalAssets -> (latest+preLatest)/2  || latest  در صورت وجود هر دو مقدار میانگین و در غیر اینصورت اخرین مقدار در اطلاعیه ها
    let profitLoss; //profitLoss -> latest - preLatest (اختلاف دوره دو عدد 3 ماهه است)
    let ROA = null;
    try {
      // دریافت داده های با کلید EPS برای نماد مشخص شده و فراخوانی تابع ایجاد خروجی مورد نظر
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': { $gte: twoYearsAgo }
      }).sort({ 'periodEndToDate': -1 }).toArray();
      if (mongoData.length > 0) {
        profitLoss = await this.fetchProfitLossValue(mongoData);
        totalAssets = await this.fetchTotalAssetsValue(mongoData);
        ROA = (profitLoss && totalAssets) ? profitLoss / totalAssets : null;
        ROA = ROA ? +ROA.toFixed(4) : null;
        return ROA;
      }
    } catch (error) {
      BaseConfig.partLogger.error('totalAssets', error);
    }
  }

  async fetchProfitLossValue(allStatements) {
    try {
      let res = utility.groupByPdate(allStatements);
      allStatements = res.allStatements;
      let statementsObj = res.statementsObj;
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let samePeriod = null;  // اطلاعیه مرتبط با دوره ی مشابه در سال قبل
      let sumProfitLoss = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.ProfitAndLoss;
      if (lastStm.period === 12) {
        sumProfitLoss = lastPeriod ? lastPeriod.column_1.fields.profitLoss !== null ? lastPeriod.column_1.fields.profitLoss : null : null;
        return sumProfitLoss;
      }
      else if (lastPeriod) {
        let yearlyPeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), lastPeriod.column_1.period).replaceAll('/', '').substring(0, 6);  // اخرین اطلاعیه با دوره 12 ماهه
        let samePeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), 12).replaceAll('/', '').substring(0, 6);   //1 سال قبل از اخرین دوره
        if (statementsObj[yearlyPeriodDate]) {
          let obj = statementsObj[yearlyPeriodDate][0];
          yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
          yearlyPeriod = yearlyPeriod ? yearlyPeriod.ProfitAndLoss ? yearlyPeriod.ProfitAndLoss.column_1 : null : null;
        }
        if (statementsObj[samePeriodDate]) {
          let obj = statementsObj[samePeriodDate][0];
          samePeriod = await this.fetchInfoFields(obj.tracingNo);
          samePeriod = samePeriod ? samePeriod.ProfitAndLoss ? samePeriod.ProfitAndLoss.column_1 : null : null;
        }
        if (!yearlyPeriod) {
          yearlyPeriod = lastPeriod.column_3 ? lastPeriod.column_3 : null;
        }
        if (!samePeriod) {
          samePeriod = lastPeriod.column_2;
        }
        if (lastPeriod && yearlyPeriod && samePeriod) {
          sumProfitLoss = lastPeriod.column_1.fields.profitLoss !== null && yearlyPeriod.fields.profitLoss !== null && samePeriod.fields.profitLoss !== null ? lastPeriod.column_1.fields.profitLoss + yearlyPeriod.fields.profitLoss - samePeriod.fields.profitLoss : 0;
        }
      }
      return sumProfitLoss;
    } catch (e) {
      console.log(e);
    }
  }

  async fetchTotalAssetsValue(allStatements) {
    try {
      let res = utility.groupByPdate(allStatements);
      allStatements = res.allStatements;
      let statementsObj = res.statementsObj;
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let samePeriod = null;  // اطلاعیه مرتبط با دوره ی مشابه در سال قبل
      let sumTotalAssets = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastStm.period === 12) {
        sumTotalAssets = lastPeriod ? lastPeriod.column_1.fields.totalAssets !== null ? lastPeriod.column_1.fields.totalAssets : null : null;
        return sumTotalAssets;
      }
      else if (lastPeriod) {
        let yearlyPeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), lastPeriod.column_1.period).replaceAll('/', '').substring(0, 6);  // اخرین اطلاعیه با دوره 12 ماهه
        let samePeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), 12).replaceAll('/', '').substring(0, 6);   //1 سال قبل از اخرین دوره
        if (statementsObj[yearlyPeriodDate]) {
          let obj = statementsObj[yearlyPeriodDate][0];
          yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
          yearlyPeriod = yearlyPeriod ? yearlyPeriod.BalanceSheet ? yearlyPeriod.BalanceSheet.column_1 : null : null;
        }
        if (statementsObj[samePeriodDate]) {
          let obj = statementsObj[samePeriodDate][0];
          samePeriod = await this.fetchInfoFields(obj.tracingNo);
          samePeriod = samePeriod ? samePeriod.BalanceSheet ? samePeriod.BalanceSheet.column_1 : null : null;
        }
        if (!yearlyPeriod) {
          yearlyPeriod = lastPeriod.column_3 ? lastPeriod.column_3 : null;
        }
        if (!samePeriod) {
          samePeriod = lastPeriod.column_2;
        }
        if (lastPeriod && yearlyPeriod && samePeriod) {
          sumTotalAssets = lastPeriod.column_1.fields.totalAssets !== null && yearlyPeriod.fields.totalAssets !== null && samePeriod.fields.totalAssets !== null ? lastPeriod.column_1.fields.totalAssets + yearlyPeriod.fields.totalAssets - samePeriod.fields.totalAssets : 0;
        }
      }
      return sumTotalAssets;
    } catch (e) {
      console.log(e);
    }
  }

  // سود(زیان) خالص (یا همان درآمد خالص) ) تقسیم بر حقوق صاحبان سهام --> به صورت سالانه
  async calculateROE(symbol) {
    let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/jMM/jDD');
    let stockHoldersEquity;  //stockHoldersEquity -> (latest+preLatest)/2  || latest  در صورت وجود هر دو مقدار میانگین و در غیر اینصورت اخرین مقدار در اطلاعیه ها
    let profitLoss; //profitLoss -> latest - preLatest (اختلاف دوره دو عدد 3 ماهه است)
    let ROE = null;
    try {
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': { $gte: twoYearsAgo }
      }).sort({ 'periodEndToDate': -1 }).toArray();
      if (mongoData.length > 0) {
        profitLoss = await this.fetchProfitLossValue(mongoData);
        stockHoldersEquity = await this.fetchStockHoldersEquity(mongoData);
        ROE = (profitLoss && stockHoldersEquity) ? profitLoss / stockHoldersEquity : null;
        ROE = ROE ? +ROE.toFixed(4) : null;
        return ROE;
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateROE', error);
    }
  }

  async fetchStockHoldersEquity(allStatements) {
    try {
      let defer = q.defer();
      let res = utility.groupByPdate(allStatements);
      allStatements = res.allStatements;
      let statementsObj = res.statementsObj;
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let samePeriod = null;  // اطلاعیه مرتبط با دوره ی مشابه در سال قبل
      let sumStockHoldersEquity = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastStm.period === 12) {
        sumStockHoldersEquity = lastPeriod ? lastPeriod.column_1.fields.stockHoldersEquity !== null ? lastPeriod.column_1.fields.stockHoldersEquity : null : null;
        defer.resolve(sumStockHoldersEquity);
      }
      else if (lastPeriod) {
        let yearlyPeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), lastPeriod.column_1.period).replaceAll('/', '').substring(0, 6);  // اخرین اطلاعیه با دوره 12 ماهه
        let samePeriodDate = u.shamsiDateToNMonthAgo(lastPeriod.column_1.periodEndToDate.replaceAll('/', ''), 12).replaceAll('/', '').substring(0, 6);   //1 سال قبل از اخرین دوره
        async.eachOfSeries(allStatements, async (stm) => {
          try {
            let periodEndDate = stm.periodEndToDate;
            if (periodEndDate.replaceAll('/', '').substring(0, 6) === yearlyPeriodDate) {
              let obj = statementsObj[yearlyPeriodDate][0];
              yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
              yearlyPeriod = yearlyPeriod ? yearlyPeriod.BalanceSheet ? yearlyPeriod.BalanceSheet.column_1 : null : null;
            }
            if (periodEndDate.replaceAll('/', '').substring(0, 6) === samePeriodDate) {
              let obj = statementsObj[samePeriodDate][0];
              samePeriod = await this.fetchInfoFields(obj.tracingNo);
              samePeriod = samePeriod ? samePeriod.BalanceSheet.column_1 ? samePeriod.BalanceSheet.column_1 : null : null;
            }
          } catch (e) {
            console.log(e);
          }
        }, (error) => {
          if (error) {
            defer.reject(error);
          }
          else {
            if (!yearlyPeriod) {
              yearlyPeriod = lastPeriod.column_3 ? lastPeriod.column_3 : null;
            }
            if (!samePeriod) {
              samePeriod = lastPeriod.column_2;
            }
            if (lastPeriod && yearlyPeriod && samePeriod) {
              sumStockHoldersEquity = lastPeriod.column_1.fields.stockHoldersEquity !== null && yearlyPeriod.fields.stockHoldersEquity !== null && samePeriod.fields.stockHoldersEquity !== null ? lastPeriod.column_1.fields.stockHoldersEquity + yearlyPeriod.fields.stockHoldersEquity - samePeriod.fields.stockHoldersEquity : 0;
            }
            defer.resolve(sumStockHoldersEquity);
          }
        });
      }
      return defer.promise;
    } catch (e) {
      console.log(e);
    }
  }

  // https://gitlab.partdp.ir/signal/backlog/-/issues/453
  async calculateEPS(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/');
      twoYearsAgo += '01/01';
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': {
          '$gte': twoYearsAgo
        }
      }).sort({ 'periodEndToDate': -1 }).limit(9).toArray();
      if (mongoData.length > 0) {
        return await this.organizeEPSResult(mongoData);
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateEPS', error);
    }
  }

  async organizeEPSResult(allStatements) {
    try {
      let defer = q.defer();
      let finalObj = {
        'firstQuarter': [null, null],
        'secondQuarter': [null, null],
        'thirdQuarter': [null, null],
        'fourthQuarter': [null, null]
      };
      let mapPeriodCount = { 3: 5, 6: 6, 9: 7, 12: 8 };
      let mapYearFlag = { 3: 1, 6: 2, 9: 3, 12: 4 };
      let map = {
        3: 'firstQuarter', 6: 'secondQuarter', 9: 'thirdQuarter', 12: 'fourthQuarter'
      };
      let statementsObj;
      let res = utility.groupByPdate(allStatements);
      statementsObj = res.statementsObj;
      allStatements = res.allStatements;
      let lastStm = allStatements.length ? allStatements[0] : null;
      let lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      let totalCapital = lastPeriod.ProfitAndLoss ? lastPeriod.ProfitAndLoss.column_1.fields.totalCapital ? lastPeriod.ProfitAndLoss.column_1.fields.totalCapital : null : null;
      let countLoop = mapPeriodCount[lastStm.period];
      let yearFlag = mapYearFlag[lastStm.period];
      let i = 1;
      while (!totalCapital) {
        lastStm = allStatements.length ? allStatements[i] : null;
        lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
        totalCapital = lastPeriod.ProfitAndLoss ? lastPeriod.ProfitAndLoss.column_1.fields.totalCapital ? lastPeriod.ProfitAndLoss.column_1.fields.totalCapital : null : null;
        i++;
      }
      let index = 0;//  0 --> سال جاری    1 --> سال قبل
      async.eachOfSeries(allStatements, async (stm) => {
        try {
          if (yearFlag === 0)
            index = 1;
          if (countLoop === 0) {
            defer.resolve(finalObj);
          }
          else {
            if (stm.period === 3) {
              let value = await this.calculateEPSObj(stm, totalCapital);
              let key = map[stm.period];
              finalObj[key][index] = {
                'date': stm.periodEndToDate.replaceAll('/', ''),
                'value': value ? +value.toFixed(4) : 0
              };
            }
            else {
              let firstDate = stm.periodEndToDate.replaceAll('/', '');
              let newDate = u.shamsiDateToNMonthAgo(firstDate, 3);
              if (statementsObj[newDate.substring(0, 6)]) {
                let value1 = await this.calculateEPSObj(stm, totalCapital);
                let value2 = await this.calculateEPSObj(statementsObj[newDate.substring(0, 6)][0], totalCapital);
                let finalValue = (value1 != null && value2 != null) ? +(value1 - value2).toFixed(4) : null;
                let key = map[stm.period];
                finalObj[key][index] = {
                  'date': stm.periodEndToDate.replaceAll('/', ''),
                  'value': finalValue
                };
              }
            }
            yearFlag--;
            countLoop--;
          }
        } catch (e) {
          console.log(e);
        }
      }, (error) => {
        if (error) {
          defer.reject(error);
        }
        else {
          defer.resolve(finalObj);
        }
      });
      return defer.promise;
    } catch (e) {
      console.log(e);
    }
  }

  async calculateEPSObj(statement, totalCapital_main) {
    try {
      let infoFields = await this.fetchInfoFields(statement.tracingNo);
      let EPS = infoFields.ProfitAndLoss ? infoFields.ProfitAndLoss.column_1.fields.earningsPerShare ? infoFields.ProfitAndLoss.column_1.fields.earningsPerShare : null : null;
      let totalCapital = infoFields.ProfitAndLoss ? infoFields.ProfitAndLoss.column_1.fields.totalCapital ? infoFields.ProfitAndLoss.column_1.fields.totalCapital : null : null;
      let adjustedEPS = (EPS * totalCapital) / totalCapital_main;
      return adjustedEPS;
    } catch (e) {
      console.log(e);
    }
  }

  //بدهی های جاری / داریی های جاری = نسبت جاری
  async calculateCurrentRatio(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/');
      twoYearsAgo += '01/01';
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': {
          '$gte': twoYearsAgo
        }
      }).sort({ 'periodEndToDate': -1,'date':-1 }).limit(8).toArray();
      if (mongoData.length > 0) {
        return await this.organizeCurrentRatio(mongoData);
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateCurrentRatio', error);
    }
  }

  async organizeCurrentRatio(allStatements) {
    try {
      let result = {
        yearlyPeriod: null,
        lastPeriod: null
      };
      let statementsPeriods = us.groupBy(allStatements, 'period');
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let totalCurrentLiabilities_lastPeriod = null;
      let totalCurrentLiabilities_yearlyPeriod = null;
      let totalCurrentAssets_lastPeriod = null;
      let totalCurrentAssets_yearlyPeriod = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastPeriod) {
        totalCurrentLiabilities_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalCurrentLiabilities !== null ? lastPeriod.column_1.fields.totalCurrentLiabilities : null : null;
        totalCurrentAssets_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalCurrentAssets !== null ? lastPeriod.column_1.fields.totalCurrentAssets : null : null;
        if (lastStm.period === 12) {
          totalCurrentAssets_yearlyPeriod = totalCurrentAssets_lastPeriod;
          totalCurrentLiabilities_yearlyPeriod = totalCurrentLiabilities_lastPeriod;
        }
        else {
          if (statementsPeriods['12'] && statementsPeriods['12'].length) {
            let obj = statementsPeriods['12'][0];
            yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
            yearlyPeriod = yearlyPeriod.BalanceSheet;
            totalCurrentLiabilities_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalCurrentLiabilities !== null ? yearlyPeriod.column_1.fields.totalCurrentLiabilities : null : null;
            totalCurrentAssets_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalCurrentAssets !== null ? yearlyPeriod.column_1.fields.totalCurrentAssets : null : null;
          }
        }
      }
      if (totalCurrentLiabilities_yearlyPeriod && totalCurrentAssets_yearlyPeriod) {
        result.yearlyPeriod = totalCurrentAssets_yearlyPeriod / totalCurrentLiabilities_yearlyPeriod;
        result.yearlyPeriod = result.yearlyPeriod ? +(result.yearlyPeriod).toFixed(4) : null;
      }
      if (totalCurrentLiabilities_lastPeriod && totalCurrentAssets_lastPeriod) {
        result.lastPeriod = totalCurrentAssets_lastPeriod / totalCurrentLiabilities_lastPeriod;
        result.lastPeriod = result.lastPeriod ? +(result.lastPeriod).toFixed(4) : null;
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //بدهی‌های جاری / دارایی‌های جاری – موجودی مواد و کالا = نسبت آنی
  async calculateQuickRatio(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/');
      twoYearsAgo += '01/01';
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': {
          '$gte': twoYearsAgo
        }
      }).sort({ 'periodEndToDate': -1,'date':-1 }).limit(8).toArray();
      if (mongoData.length > 0) {
        return await this.organizeQuickRatio(mongoData);
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateQuickRatio', error);
    }
  }

  async organizeQuickRatio(allStatements) {
    try {
      let result = {
        yearlyPeriod: null,
        lastPeriod: null
      };
      let statementsPeriods = us.groupBy(allStatements, 'period');
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let totalCurrentLiabilities_lastPeriod = null;
      let totalCurrentLiabilities_yearlyPeriod = null;
      let totalCurrentAssets_lastPeriod = null;
      let totalCurrentAssets_yearlyPeriod = null;
      let inventories_yearlyPeriod = null;
      let inventories_lastPeriod = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastPeriod) {
        totalCurrentLiabilities_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalCurrentLiabilities !== null ? lastPeriod.column_1.fields.totalCurrentLiabilities : null : null;
        totalCurrentAssets_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalCurrentAssets !== null ? lastPeriod.column_1.fields.totalCurrentAssets : null : null;
        inventories_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.inventories !== null ? lastPeriod.column_1.fields.inventories : null : null;
        if (lastStm.period === 12) {
          totalCurrentAssets_yearlyPeriod = totalCurrentAssets_lastPeriod;
          totalCurrentLiabilities_yearlyPeriod = totalCurrentLiabilities_lastPeriod;
          inventories_yearlyPeriod = inventories_lastPeriod;
        }
        else {
          if (statementsPeriods['12'] && statementsPeriods['12'].length) {
            let obj = statementsPeriods['12'][0];
            yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
            yearlyPeriod = yearlyPeriod.BalanceSheet;
            totalCurrentLiabilities_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalCurrentLiabilities !== null ? yearlyPeriod.column_1.fields.totalCurrentLiabilities : null : null;
            totalCurrentAssets_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalCurrentAssets !== null ? yearlyPeriod.column_1.fields.totalCurrentAssets : null : null;
            inventories_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.inventories !== null ? yearlyPeriod.column_1.fields.inventories : null : null;
          }
        }
      }
      if (totalCurrentLiabilities_yearlyPeriod && totalCurrentAssets_yearlyPeriod) {
        if (inventories_yearlyPeriod >= 0) {
          result.yearlyPeriod = (inventories_yearlyPeriod - totalCurrentAssets_yearlyPeriod) / totalCurrentLiabilities_yearlyPeriod;
        }
        else {
          result.yearlyPeriod = totalCurrentAssets_yearlyPeriod / totalCurrentLiabilities_yearlyPeriod;
        }
        result.yearlyPeriod = result.yearlyPeriod ? +(result.yearlyPeriod).toFixed(4) : null;
      }
      if (totalCurrentLiabilities_lastPeriod && totalCurrentAssets_lastPeriod) {
        if (inventories_lastPeriod >= 0)
          result.lastPeriod = (inventories_lastPeriod - totalCurrentAssets_lastPeriod) / totalCurrentLiabilities_lastPeriod;
        else
          result.lastPeriod = totalCurrentAssets_lastPeriod / totalCurrentLiabilities_lastPeriod;
        result.lastPeriod = result.lastPeriod ? +(result.lastPeriod).toFixed(4) : null;
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //بدهی‌های جاری / موجودی نقدی+ سرمایه‌گذاری‌های کوتاه‌مدت = نسبت وجه نقد
  async calculateCashRatio(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/');
      twoYearsAgo += '01/01';
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': {
          '$gte': twoYearsAgo
        }
      }).sort({ 'periodEndToDate': -1,'date':-1 }).limit(8).toArray();
      if (mongoData.length > 0) {
        return await this.organizeCashRatio(mongoData);
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateQuickRatio', error);
    }
  }

  async organizeCashRatio(allStatements) {
    try {
      let result = {
        yearlyPeriod: null,
        lastPeriod: null
      };
      let statementsPeriods = us.groupBy(allStatements, 'period');
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let totalCurrentLiabilities_lastPeriod = null;
      let totalCurrentLiabilities_yearlyPeriod = null;
      let cashBalance_lastPeriod = null;
      let cashBalance_yearlyPeriod = null;
      let shortTermInvestments_yearlyPeriod = null;
      let shortTermInvestments_lastPeriod = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastPeriod) {
        totalCurrentLiabilities_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalCurrentLiabilities !== null ? lastPeriod.column_1.fields.totalCurrentLiabilities : null : null;
        cashBalance_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.cashBalance !== null ? lastPeriod.column_1.fields.cashBalance : null : null;
        shortTermInvestments_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.shortTermInvestments !== null ? lastPeriod.column_1.fields.shortTermInvestments : null : null;
        if (lastStm.period === 12) {
          shortTermInvestments_yearlyPeriod = shortTermInvestments_lastPeriod;
          totalCurrentLiabilities_yearlyPeriod = totalCurrentLiabilities_lastPeriod;
          cashBalance_yearlyPeriod = cashBalance_lastPeriod;
        }
        else {
          if (statementsPeriods['12'] && statementsPeriods['12'].length) {
            let obj = statementsPeriods['12'][0];
            yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
            yearlyPeriod = yearlyPeriod.BalanceSheet;
            totalCurrentLiabilities_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalCurrentLiabilities !== null ? yearlyPeriod.column_1.fields.totalCurrentLiabilities : null : null;
            shortTermInvestments_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.shortTermInvestments !== null ? yearlyPeriod.column_1.fields.shortTermInvestments : null : null;
            cashBalance_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.cashBalance !== null ? yearlyPeriod.column_1.fields.cashBalance : null : null;
          }
        }
      }
      if (totalCurrentLiabilities_yearlyPeriod && (shortTermInvestments_yearlyPeriod !== null) && cashBalance_yearlyPeriod) {
        result.yearlyPeriod = (shortTermInvestments_yearlyPeriod + cashBalance_yearlyPeriod) / totalCurrentLiabilities_yearlyPeriod;
        result.yearlyPeriod = result.yearlyPeriod ? +(result.yearlyPeriod).toFixed(4) : null;
      }
      if (totalCurrentLiabilities_lastPeriod && (shortTermInvestments_lastPeriod !== null) && cashBalance_lastPeriod) {
        result.lastPeriod = (shortTermInvestments_lastPeriod + cashBalance_lastPeriod) / totalCurrentLiabilities_lastPeriod;
        result.lastPeriod = result.lastPeriod ? +(result.lastPeriod).toFixed(4) : null;
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  //مجموع دارایی‌ها / مجموع بدهی‌ها = نسبت بدهی
  async calculateDebtRatio(symbol) {
    try {
      let twoYearsAgo = moment().subtract(2, 'years').format('jYYYY/');
      twoYearsAgo += '01/01';
      let mongoData = await BaseConfig.mongoDBO.collection('CodalStatements').find({
        'symbol': symbol.symbol,
        'type': 'IFS_NotAudited_Orig',
        'hasInfo': true,
        'periodEndToDate': {
          '$gte': twoYearsAgo
        }
      }).sort({ 'periodEndToDate': -1 ,'date':-1}).limit(8).toArray();
      if (mongoData.length > 0) {
        return await this.organizeDebtRatio(mongoData);
      }
    } catch (error) {
      BaseConfig.partLogger.error('calculateQuickRatio', error);
    }
  }

  async organizeDebtRatio(allStatements) {
    try {
      let result = {
        yearlyPeriod: null,
        lastPeriod: null
      };
      let statementsPeriods = us.groupBy(allStatements, 'period');
      let lastPeriod; // اطلاعیه مرتبط با اخرین اطلاعیه
      let yearlyPeriod = null; // اطلاعیه مرتبط با اخرین 12 ماهه
      let totalAssets_lastPeriod = null;
      let totalAssets_yearlyPeriod = null;
      let totalLiabilities_lastPeriod = null;
      let totalLiabilities_yearlyPeriod = null;
      let lastStm = allStatements.length ? allStatements[0] : null;
      lastPeriod = await this.fetchInfoFields(lastStm.tracingNo);
      lastPeriod = lastPeriod.BalanceSheet;
      if (lastPeriod) {
        totalAssets_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalAssets !== null ? lastPeriod.column_1.fields.totalAssets : null : null;
        totalLiabilities_lastPeriod = lastPeriod ? lastPeriod.column_1.fields.totalLiabilities !== null ? lastPeriod.column_1.fields.totalLiabilities : null : null;
        if (lastStm.period === 12) {
          totalAssets_yearlyPeriod = totalAssets_lastPeriod;
          totalLiabilities_yearlyPeriod = totalLiabilities_lastPeriod;
        }
        else {
          if (statementsPeriods['12'] && statementsPeriods['12'].length) {
            let obj = statementsPeriods['12'][0];
            yearlyPeriod = await this.fetchInfoFields(obj.tracingNo);
            yearlyPeriod = yearlyPeriod.BalanceSheet;
            totalAssets_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalAssets !== null ? yearlyPeriod.column_1.fields.totalAssets : null : null;
            totalLiabilities_yearlyPeriod = yearlyPeriod ? yearlyPeriod.column_1.fields.totalLiabilities !== null ? yearlyPeriod.column_1.fields.totalLiabilities : null : null;
          }
        }
      }
      if (totalAssets_yearlyPeriod && totalLiabilities_yearlyPeriod) {
        result.yearlyPeriod = totalLiabilities_yearlyPeriod / totalAssets_yearlyPeriod;
        result.yearlyPeriod = result.yearlyPeriod ? +(result.yearlyPeriod).toFixed(4) : null;
      }
      if (totalAssets_lastPeriod && totalLiabilities_lastPeriod) {
        result.lastPeriod = totalLiabilities_lastPeriod / totalAssets_lastPeriod;
        result.lastPeriod = result.lastPeriod ? +(result.lastPeriod).toFixed(4) : null;
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchInfoFields(tracingNo) {
    try {
      let info = await BaseConfig.mongoDBO.collection('statementsInfo').findOne({ tracingNo: tracingNo }, { fields: { info: 0 } });
      return info;
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = CalculatingMethods;
