/**
 * @namespace statmentsBL
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
let utility = require('../utility');
let statementsInfoBl = require('./statementsInfoBl');

/**
 * @class StatementsBl
 * @extends {BaseBussinessLogic}
 */
class ExtractInfoFieldsBl extends BaseBussinessLogic {

  async extractInfo(infoObj) {
    infoObj.extractFields = await this.extractInfoFields(infoObj);
    await this.checkAndUpdateSymbolCalculatingType(infoObj.symbol, infoObj.type);
    await this.updateDBs(infoObj);
    this.updateLV(infoObj.tracingNo);
  }

  async extractInfoFields(infoObj) {
    try {
      let result = {};
      if (infoObj.letterType === 58) {
        result = this.extractMonthlyActivityStatement(infoObj);
      }
      else {
        if (infoObj.letterType === 6) {
          result.ProfitAndLoss = this.extractProfitAndLossStatement(infoObj);
          result.BalanceSheet = this.extractBalanceSheetStatement(infoObj);
        }
        let banksList = await BaseConfig.mongoDBO.collection('symbolList').find({
          industryName: 'بانکها و موسسات اعتباری'
        }).toArray();
        banksList = banksList.map(item => {
          return item.symbol;
        });
        if (banksList.includes(infoObj.symbol)) {
          let res = this.extractInterpretativeReportSummaryPage1(infoObj);
          if (Object.keys(res).length) {
            result.InterpretativeReportSummary_Page1 = res;
          }
          let page2 = this.extractInterpretativeReportSummaryPage2(infoObj);
          if (Object.keys(page2).length) {
            result.InterpretativeReportSummary_Page2 = page2;
          }
        }
      }
      return result;
    } catch (error) {
      utility.consoleLog(' exception on extract fields ');
      let tracingNo = infoObj.tracingNo;
      let date = moment().format('jYYYY/jMM/jDD');
      await BaseConfig.mongoDBO.collection('statementsInfo').remove({tracingNo: tracingNo});
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
          item.contentNeed = true;
          item.hasInfo = 'noInfo';
        }
      });
      await BaseConfig.mongoDBO.collection('infoError').updateOne(
        {tracingNo: tracingNo},
        {
          $set: {
            error: 'خطا در عملیات استخراج داده از محتوا',
            date: date,
            description : error.stack
          },
          $inc: {count: 1}
        },
        {upsert: true});
      BaseException.raiseError(error,'خطا در عملیات استخراج داده از محتوا' + tracingNo);
    }
  }

  extractProfitAndLossStatement(infoObj) {
    let outPutObj = {};

    if (infoObj.info.hasOwnProperty('interim')) {
      if (infoObj.info.interim.hasOwnProperty('interimStatements')) {
        let yearData = infoObj.info.interim.yearData;
        outPutObj = this.getColumn(yearData);
        let tableRow = infoObj.info.interim.interimStatements;
        let keyName;

        for (let row of tableRow) {
          keyName = '';

          switch (row.fieldName) {
            case 'TotalRevenue':case 'Sales':// جمع درآمدهای عملیاتی - TotalRevenue
              keyName = 'operatingIncome ';
              break;
            case 'EarningsPerShareAfterTax':// سود (زیان) خالص هر سهم - EarningsPerShareAfterTax
              keyName = 'earningsPerShare';
              break;
            case 'ProfitLoss2':case 'NetIncomeLoss':// سود(زیان) خالص - ProfitLoss
              keyName = 'profitLoss';
              break;
            case 'TotalMutualRevenue': // جمع درآمدهای مشاع - TotalMutualRevenue
              keyName = 'totalMutualRevenue';
              break;
            case 'BankQuotaJointRevenueHonorarium':// سهم بانک از درآمد‌های مشاع - BankQuotaJointRevenueHonorarium
              keyName = 'bankQuotaJointRevenueHonorarium';
              break;
            case 'TotalNonMutualRevenue': // جمع درآمدهای غیرمشاع - TotalNonMutualRevenue
              keyName = 'totalNonMutualRevenue';
              break;
            case 'CommissionExpenseFeeExpense': // درآمد کارمزد - CommissionExpenseFeeExpense
              keyName = 'commissionIncome';
              break;
            case 'CommissionExpense': // هزینه کارمزد - CommissionExpense
              keyName = 'commissionCost';
              break;
            case 'TotalExpense':// جمع هزینه‌ها - TotalExpense
              keyName = 'totalCost';
              break;
            case 'ListedCapital':// سرمایه - ListedCapital
              keyName = 'totalCapital';
              break;
            case 'ForeignExchangeTransactions':// نتیجه مبادلات ارزی - ForeignExchangeTransactions
              keyName = 'foreignExchangeTransactions';
              break;
            case 'GeneralAdministrativeExpense':  // سایر هزینه‌های اجرایی - GeneralAdministrativeExpense
              keyName = 'generalAdministrativeExpense';
              break;
            case 'EmployeeBenefitsExpense':// هزینه‌های کارکنان - EmployeeBenefitsExpense
              keyName = 'employeeCost';
              break;
          }

          if (keyName) {
            for (let columnId in outPutObj) {
              outPutObj[columnId]['fields'][keyName] = +row[outPutObj[columnId]['column']];
            }
            keyName = '';
          }
        }
      }
    }
    //جدید
    else if (infoObj.info.hasOwnProperty('incomeStatement')) {
      let yearData = infoObj.info.incomeStatement.incomeStatement.yearData;
      outPutObj = this.getColumn(yearData);
      let tableRow = infoObj.info.incomeStatement.incomeStatement.rowItems;
      let keyName;

      for (let row of tableRow) {
        keyName = '';
        let field = row['value_' + (outPutObj['column_1']['column'] - 1)];
        if ((row.oldFieldName === 'Sales' || row.oldFieldName === 'NonMutualRevenue')) {
          keyName='operatingIncome';
        } else if (field === 'جمع درآمدهای عملیاتی' || field === 'جمع درآمدها') {
          keyName='operatingIncome';
        }
        if (row.oldFieldName === 'TotalMutualRevenue') {
          keyName='totalMutualRevenue';
        } else if (field === 'جمع درآمدهای مشاع') {
          keyName='totalMutualRevenue';
        }
        if (row.oldFieldName === 'BankQuotaJointRevenueHonorarium') {
          keyName='bankQuotaJointRevenueHonorarium';
        } else if (field === 'سهم بانک از درآمدهای مشاع') {
          keyName='bankQuotaJointRevenueHonorarium';
        }
        if (row.oldFieldName === 'TotalNonMutualRevenue') {
          keyName='totalNonMutualRevenue';
        } else if (field === 'جمع درآمدهای غیرمشاع') {
          keyName='totalNonMutualRevenue';
        }
        if (row.oldFieldName === 'TotalExpense') {
          keyName='totalCost';
        } else if (field === 'جمع هزینه‌ها') {
          keyName='totalCost';
        }
        if (row.oldFieldName === 'ForeignExchangeTransactions') {
          keyName='foreignExchangeTransactions';
        } else if (field === 'نتیجه مبادلات ارزی') {
          keyName='foreignExchangeTransactions';
        }
        if (row.oldFieldName === 'GeneralAdministrativeExpense') {
          keyName='generalAdministrativeExpense';
        } else if (field === 'سایر هزینه‌های اجرایی') {
          keyName='generalAdministrativeExpense';
        }
        if (row.oldFieldName === 'EmployeeBenefitsExpense') {
          keyName='employeeCost';
        } else if (field === 'هزینه‌های کارکنان') {
          keyName='employeeCost';
        }
        if (row.oldFieldName === 'CommissionExpenseFeeExpense' || row.oldFieldName === 'CostOfGoodsSale') {
          if (field === 'درآمد کارمزد') {
            keyName='commissionIncome';
          }
        } else if (field === 'درآمد کارمزد') {
          keyName='commissionIncome';
        }
        if (row.oldFieldName === 'CommissionExpense') {
          if (field === 'هزینه کارمزد') {
            keyName='commissionCost';
          }
        } else if (row.oldFieldName === 'TotalMutualRevenue') {
          keyName='commissionCost';
        } else if (field === 'هزینه کارمزد') {
          keyName='commissionCost';
        }
        if (tableRow.indexOf(row) >= 6) {
          if (row.oldFieldName === 'ProfitLoss') { // todo remove if
            if (field === 'سود (زیان) خالص' || field === 'سود(زیان) خالص') {
              keyName='profitLoss';
            }
          } else if (field === 'سود (زیان) خالص' || field === 'سود(زیان) خالص') {
            keyName='profitLoss';
          }
        }
        if (row.oldFieldName === 'EarningsPerShareAfterTax') {
          keyName='earningsPerShare';
        } else if ((field === 'سود (زیان) خالص هر سهم– ریال') || (field === 'سود (زیان) خالص هر سهم- ریال')) {
          keyName='earningsPerShare';
        }
        if (row.oldFieldName === 'ListedCapital' || field === 'سرمایه') {
          keyName='totalCapital';
        }
        if (field === 'خالص درآمد تسهیلات و سپرده گذاری') {
          keyName='netFacilityAndDepositIncome';
        }
        if (field === 'خالص سود (زیان) سرمایه گذاری‌ها') {
          keyName='netProfitLossOfInvestments';
        }
        if (field === 'خالص سود (زیان) مبادلات و معاملات ارزی') {
          keyName='netProfitLossOfForeignExchangeTransactions';
        }
        if (field === 'هزینه استهلاک') {
          keyName='depreciationCost';
        }
        if (field === 'هزینه‌های اداری و عمومی') {
          keyName='administrativeAndGeneralExpenses';
        }
        if (field === 'سایر درآمدها و هزینه های  عملیاتی') {
          keyName='otherOperatingIncomeAndExpenses';
        }

        if (keyName) {
          for (let columnId in outPutObj) {
            outPutObj[columnId]['fields'][keyName] = +row['value_' + outPutObj[columnId]['column']];
          }
          keyName = '';
        }
      }
    }
    return outPutObj;
  }

  extractBalanceSheetStatement(infoObj) {
    let outPutObj = {};
    if (infoObj.info.hasOwnProperty('balanceSheet')) {
      if (infoObj.info.balanceSheet.hasOwnProperty('financialPositions')) {
        let yearData = infoObj.info.balanceSheet.yearData;
        outPutObj = this.getColumn(yearData);
        let keyName;
        for (let row of infoObj.info.balanceSheet.financialPositions) {
          keyName = '';

          switch (row.fieldName) {
            case 'InvestmentInSecurities'://سرمایه گذاری در سهام و سایر اوراق بهادار - InvestmentInSecurities
              keyName = 'investmentInSecurities';
              break;
            case 'ReceivableFromAffiliatedCompanies': // مطالبات از بانک ها و سایر موسسات اعتباری - ReceivableFromAffiliatedCompanies
              keyName = 'receivableFromBanksAndOther';
              break;
            case 'DemandsOfGovernment':// DemandsOfGovernment - مطالبات از دولت
              keyName = 'receivableFromGovernment';
              break;
            case 'TotalAssets': // جمع دارایی -  TotalAssets
              keyName = 'totalAssets';
              break;
            case 'TotalStockHoldersEquity': // جمع حقوق صاحبان سهام ||  جمع حقوق مالکانه
              keyName = 'stockHoldersEquity';
              break;
            case 'DebtToAffiliatedComponies': // بدهی به بانک‌ها و سایر موسسات اعتباری    ||   بدهی به بانک ها و سایر موسسات اعتباری - DebtToAffiliatedComponies
              keyName = 'debtToBanksAndOther';
              break;
            case 'CashAndCashEquivalents':// موجودی نقد - CashAndCashEquivalents
              keyName = 'cashBalance';
              break;
            case 'LegalReserve':// اندوخته های قانونی - LegalReserve
              keyName = 'legalReserve';
              break;
            case 'TotalLiabilities': // جمع بدهی‌ها - TotalLiabilities
              keyName = 'totalLiabilities';
              break;
            case 'ReceivablesFromGovernmentEntities':// تسهیلات اعطایی و مطالبات از اشخاص دولتی به غیر از بانک‌ها - ReceivablesFromGovernmentEntities
              keyName = 'loansAndReceivablesFromGovernmentalEntitiesOtherThanBanks';
              break;
            case 'LoansAndReceivablesFromNongovernmentalPartiesOtherThanBanks':// تسهیلات اعطایی و مطالبات از اشخاص غیردولتی به غیر از بانک‌ها - LoansAndReceivablesFromNongovernmentalPartiesOtherThanBanks
              keyName = 'loansAndReceivablesFromNonGovernmentalEntitiesOtherThanBanks';
              break;
            case 'TradeNotesAndAccountsPayable':// بدهی به بانک مرکزی و صندوق توسعه ملی - TradeNotesAndAccountsPayable
              keyName = 'debtToCenteralBankAndNDF';
              break;
            case 'TradeNotesAndAccountsReceivable': // TradeNotesAndAccountsReceivable - مطالبات از بانک مرکزی
              keyName = 'tradeNotesAndAccountsReceivable';
              break;
            case 'TotalCurrentLiabilities'://جمع بدهی‌های جاری - TotalCurrentLiabilities
              keyName = 'totalCurrentLiabilities';
              break;
            case 'TotalCurrentAssets'://جمع دارایی‌های جاری - TotalCurrentAssets
              keyName = 'totalCurrentAssets';
              break;
            case 'ShortTermInvestments':// سرمایه‌گذاری‌‌های کوتاه‌مدت - ShortTermInvestments سرمایه‌گذاری‌های کوتاه‌مدت
              keyName = 'shortTermInvestments';
              break;
            case 'Inventories':// موجودی مواد و کالا ,Inventories
              keyName = 'inventories';
              break;
            case 'RetainedEarnings'://سود و زیان انباشته
              keyName = 'retainedEarnings';
              break;
            case 'CommonStock': //سرمایه
              keyName = 'commonStock';
              break;
          }

          if (keyName) {
            for (let columnId in outPutObj) {
              outPutObj[columnId]['fields'][keyName] = +row[outPutObj[columnId]['column']];
            }
            keyName = '';
          }
        }
      }
      else if (infoObj.info.balanceSheet.hasOwnProperty('balanceSheet')) {
        let yearData = infoObj.info.balanceSheet.balanceSheet.yearData;
        outPutObj = this.getColumn(yearData);
        let tableRow = infoObj.info.balanceSheet.balanceSheet.rowItems;
        let keyName;
        for (let row of tableRow) {
          keyName = '';
          let field = row['value_' + (outPutObj['column_1']['column'] - 1)];

          if (field === 'جمع دارایی‌ها') keyName = 'totalAssets';
          else if (row.oldFieldName === 'TotalAssets') keyName = 'totalAssets';
          if (row.oldFieldName === 'CommonStock' || field === 'سرمایه') keyName = 'commonStock';
          if (field === 'سپرده های مشتریان' || field === 'سپرده‌های مشتریان') keyName = 'customerDeposits';// سپرده مشتریان
          if (field === 'سود (زیان) انباشته' || row.oldFieldName === 'RetainedEarnings') keyName = 'retainedEarnings';
          if (row.oldFieldName === 'TotalStockHoldersEquity') keyName = 'stockHoldersEquity';
          else if (field === 'جمع حقوق صاحبان سهام' || field === 'جمع حقوق مالکانه') keyName = 'stockHoldersEquity';
          if (field === 'موجودی نقد') keyName = 'cashBalance';
          if (field === 'اندوخته قانونی') keyName = 'legalReserve';
          if (field === 'مطالبات دولت' || field === 'مطالبات از دولت') keyName = 'receivableFromGovernment';
          if (field === 'مطالبات از بانک ها و سایر موسسات اعتباری' || field === 'مطالبات از بانک ها  و سایر موسسات اعتباری') keyName = 'receivableFromBanksAndOther';
          if (field === 'سرمایه گذاری در سهام و سایر اوراق بهادار' || field === 'سرمایه‌گذاری در سهام و ساير اوراق بهادار' || field === 'سرمایه‌گذاری در سهام و سایر اوراق بهادار') keyName = 'investmentInSecurities';
          if (field === 'بدهی به بانک ها و سایر موسسات اعتباری' || field === 'بدهی به بانکها و سایر موسسات اعتباری') keyName = 'debtToBanksAndOther';
          if (field === 'تسهیلات اعطایی و مطالبات از اشخاص دولتی') keyName = 'loansAndReceivablesFromGovernmentEntities';// تسهیلات اعطایی و مطالبات از اشخاص دولتی
          if (field === 'تسهیلات اعطایی و مطالبات از اشخاص غیر دولتی') keyName = 'loansAndReceivablesFromNonGovernmentalEntities';// تسهیلات اعطایی و مطالبات از اشخاص غیر دولتی
          if (field === 'سپرده قانونی') keyName = 'legalDeposit';// سپرده قانونی
          if (field === 'جمع بدهی‌های جاری') keyName = 'totalCurrentLiabilities';
          if (field === 'جمع دارایی‌های جاری') keyName = 'totalCurrentAssets';
          if (field === 'سرمایه‌گذاری‌‌های کوتاه‌مدت' || field === 'سرمایه‌گذاری‌های کوتاه‌مدت') keyName = 'shortTermInvestments';
          if (field === 'موجودی مواد و کالا') keyName = 'inventories';
          if (row.oldFieldName === 'TotalLiabilities' || field === 'جمع بدهی‌ها' || field === 'جمع بدهی ها') keyName = 'totalLiabilities';

          if (keyName) {
            for (let columnId in outPutObj) {
              outPutObj[columnId]['fields'][keyName] = +row['value_' + outPutObj[columnId]['column']];
            }
            keyName = '';
          }
        }
      }
    }
    return outPutObj;
  }

  extractMonthlyActivityStatement(infoObj) {
    let outPutObj = {Facilities: [], Deposits: []};

    if ((infoObj.info.facilities && infoObj.info.deposites) || infoObj.info.banks) {
      let facilities =infoObj.info.facilities?infoObj.info.facilities:(infoObj.info.banks &&infoObj.info.banks.facilities?infoObj.info.banks.facilities:[]);
      outPutObj.Facilities = facilities.map(({depositAndFacilitiesId,...keepAttrs}) => keepAttrs);
      let deposites =infoObj.info.deposites?infoObj.info.deposites:(infoObj.info.banks &&infoObj.info.banks.deposits?infoObj.info.banks.deposits:[]);
      outPutObj.Deposits = deposites.map(({depositAndFacilitiesId,...keepAttrs}) => keepAttrs);
    }
    else if (infoObj.info.monthlyActivity) {
      let monthlyActivity=infoObj.info.monthlyActivity;
      if (monthlyActivity.facilityInfo) {
        let rowItems = monthlyActivity.facilityInfo.rowItems;
        outPutObj.Facilities = rowItems.map(row => {
          return {
            facilityTitle: row['value_24631'],
            earlyRemain: +row['value_24632'],
            earlyRemainModifications: +row['value_24633'],
            earlyRemainModified: +row['value_24634'],
            duringGranted: +row['value_24635'],
            duringProceed: +row['value_24636'],
            endRemain: +row['value_24637'],
            prevRevenueTotal: +row['value_24638'],
            prevRevenueModifications: +row['value_24639'],
            prevRevenueModified: +row['value_246310'],
            revenueDuringMonth: +row['value_246311'],
            totalRevenue: +row['value_246312'],
          };
        });
      }
      if (monthlyActivity.depositInfo) {
        let rowItems = monthlyActivity.depositInfo.rowItems;
        outPutObj.Deposits=rowItems.map(row=>{
          return {
            depositTitle : row['value_24641'],
            earlyRemain :+row['value_24642'],
            earlyRemainModifications : +row['value_24643'],
            earlyRemainModified : +row['value_24644'],
            duringGranted : +row['value_24645'],
            duringProceed : +row['value_24646'],
            endRemain : +row['value_24647'],
            prevRevenueTotal : +row['value_24648'],
            prevRevenueModifications : +row['value_24649'],
            prevRevenueModified : +row['value_246410'],
            revenueDuringMonth : +row['value_246411'],
            totalRevenue : +row['value_246412']
          };
        });
      }
    }
    return outPutObj;
  }

  extractInterpretativeReportSummaryPage1(infoObj) {
    let outPutObj = {};
    let reserveFacilityForRecoveryAndStorage = this.extractReserveFacilityForRecoveryAndStorage(infoObj);
    let depositsReceivedFromCustomers = this.extractDepositsReceivedFromCustomers(infoObj);
    if (Object.keys(reserveFacilityForRecoveryAndStorage).length)
      outPutObj.reserveFacilityForRecoveryAndStorage = reserveFacilityForRecoveryAndStorage;
    if (Object.keys(depositsReceivedFromCustomers).length)
      outPutObj.depositsReceivedFromCustomers = depositsReceivedFromCustomers;
    return outPutObj;
  }

  extractReserveFacilityForRecoveryAndStorage(infoObj) {
    let firstSumFlag = 0;
    let outPutObj = {};
    let page1 = infoObj.info['interpretativeReportSummary-Page1'] ? infoObj.info['interpretativeReportSummary-Page1'] : (infoObj.info['interpretativeReportSummaryPage1'] ? infoObj.info['interpretativeReportSummaryPage1'] : null);
    let reserveFacilityForRecoveryAndStorage = page1 && page1.reserveFacilityForRecoveryAndStorage ? page1.reserveFacilityForRecoveryAndStorage :
      (page1 && page1.reserveFacilityForRecoveryAndStorageOfDoubtfulClaims ? page1.reserveFacilityForRecoveryAndStorageOfDoubtfulClaims : null);
    if (reserveFacilityForRecoveryAndStorage) {
      let yearData = reserveFacilityForRecoveryAndStorage.yearData;
      outPutObj = this.getColumn(yearData);
      let tableRow = reserveFacilityForRecoveryAndStorage.rowItems;
      let keyName;
      for (let row of tableRow) {
        keyName = '';
        let field = row['value_' + (outPutObj['column_1']['column'] - 1)];
        switch (field) {
          case 'جمع':
            keyName = firstSumFlag ? 'lastSum' : 'firstSum';
            firstSumFlag = 1;
            break;
          case 'مانده تسهیلات پایان دوره':
            keyName = 'endOfCourseFacilityBalance';
            break;
        }
        if (keyName) {
          for (let periodEndToDate in outPutObj) {
            outPutObj[periodEndToDate]['fields'][keyName] = +row['value_' + outPutObj[periodEndToDate]['column']];
          }
          keyName = '';
        }
      }
    }
    return outPutObj;
  }

  extractDepositsReceivedFromCustomers(infoObj) {
    let outPutObj = {};
    let page1 = infoObj.info['interpretativeReportSummary-Page1'] ? infoObj.info['interpretativeReportSummary-Page1'] : (infoObj.info['interpretativeReportSummaryPage1'] ? infoObj.info['interpretativeReportSummaryPage1'] : null);
    let depositsReceivedFromCustomers = page1 && page1.depositsReceivedFromCustomers ? page1.depositsReceivedFromCustomers : null;

    if (depositsReceivedFromCustomers) {
      let yearData = depositsReceivedFromCustomers.yearData;
      outPutObj = this.getColumn(yearData);
      let tableRow = depositsReceivedFromCustomers.rowItems;

      for (let row of tableRow) {
        let field = row['value_' + (outPutObj['column_1']['column'] - 1)];
        let keyName = '';
        switch (field) {
          case 'جمع سپرده‌های ریالی' :case 'جمع سپرده های ریالی':
            keyName = 'totalRialDeposits';
            break;
          case  'سپرده‌های ارزی': case'سپرده های ارزی':
            keyName = 'foreignCurrencyDeposits';
            break;
          case  'جمع سپرده‌های دریافتی':case 'جمع سپرده های دریافتی':
            keyName = 'totalDepositsReceived';
            break;
          case  'سپرده‌های کوتاه مدت':case 'سپرده های کوتاه مدت':
            keyName = 'shortTermDeposits';
            break;
          case  'سپرده‌های کوتاه مدت ویژه' :case 'سپرده های کوتاه مدت ویژه':
            keyName = 'specialShortTermDeposits';
            break;
          case  'سپرده‌های بلند مدت':case 'سپرده های بلند مدت':
            keyName = 'longTermDeposits';
            break;
          case  'سپرده‌های غیر هزینه زا':case 'سپرده های غیر هزینه زا':
            keyName = 'nonCostlyDeposits';
            break;
          case  'جمع سپرده‌های هزینه زا':case 'جمع سپرده های هزینه زا':
            keyName = 'totalCostlyDeposits';
            break;
        }

        if (keyName) {
          for (let periodEndToDate in outPutObj) {
            let value = row['value_' + outPutObj[periodEndToDate]['column']];
            outPutObj[periodEndToDate]['fields'][keyName] = value ? +value : null;
          }
          keyName = '';
        }
      }

    }
    return outPutObj;
  }

  extractInterpretativeReportSummaryPage2(infoObj) {
    let outPutObj = {};
    let page2 = infoObj.info['interpretativeReportSummary-Page2'] ? infoObj.info['interpretativeReportSummary-Page2'] : (infoObj.info['interpretativeReportSummaryPage2'] ? infoObj.info['interpretativeReportSummaryPage2'] : null);
    let staffStatus = page2 && page2.staffStatus ? page2.staffStatus : null;
    let rightInformationAndCapitalAdequacy = page2 && page2.rightInformationAndCapitalAdequacy ? page2.rightInformationAndCapitalAdequacy : null;

    if (staffStatus) {
      outPutObj.staffStatus = {};
      let yearData = staffStatus.yearData;
      outPutObj.staffStatus = this.getColumn(yearData);

      let tableRow = staffStatus.rowItems;
      for (let row of tableRow) {
        let field = row['value_' + (outPutObj.staffStatus['column_1']['column'] - 1)];
        let keyName = '';
        switch (field) {
          case 'تعداد شعب' :
            keyName = 'branchCount';
            break;
          case 'تعداد کارکنان' :
            keyName = 'staffCount';
            break;
        }
        if (keyName) {
          for (let periodEndToDate in outPutObj.staffStatus) {
            let value = +row['value_' + outPutObj.staffStatus[periodEndToDate]['column']];
            outPutObj.staffStatus[periodEndToDate]['fields'][keyName] = value ? value : null;
          }
          keyName = '';
        }
      }
    }
    if (rightInformationAndCapitalAdequacy) {
      outPutObj.rightInformationAndCapitalAdequacy = {};
      let yearData = rightInformationAndCapitalAdequacy.yearData;
      outPutObj.rightInformationAndCapitalAdequacy = this.getColumn(yearData);
      let tableRow = rightInformationAndCapitalAdequacy.rowItems;
      for (let row of tableRow) {
        let field = row['value_' + (outPutObj.rightInformationAndCapitalAdequacy['column_1']['column'] - 1)];
        let keyName = '';
        if (field === 'نسبت کفایت سرمایه') keyName = 'capitalAdequacyRatio';
        if (keyName) {
          for (let periodEndToDate in outPutObj.rightInformationAndCapitalAdequacy) {
            let value = +row['value_' + outPutObj.rightInformationAndCapitalAdequacy[periodEndToDate]['column']];
            outPutObj.rightInformationAndCapitalAdequacy[periodEndToDate]['fields'][keyName] = value ? value : null;
          }
          keyName = '';
        }
      }
    }

    return outPutObj;
  }

  async updateDBs(infoObj) {
    let newFields = infoObj.extractFields;
    newFields.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
    let result = await BaseConfig.mongoDBO.collection('statementsInfo').updateOne(
      {tracingNo: infoObj.tracingNo},
      {
        $set: newFields
      },
      {upsert: true});
    if (result.modifiedCount) {
      utility.consoleLog(infoObj.tracingNo + ' extract Info ');
      await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
        {tracingNo: infoObj.tracingNo},
        {
          $set: {
            contentNeed: false,
            hasInfo: true
          }
        },
        {upsert: true});
    }
  }

  updateLV(tracingNo) {
    BaseConfig.statements.forEach((item) => {
      if (item.tracingNo === tracingNo) {
        item.contentNeed = false;
        item.hasInfo = true;
      }
    });
  }

  getColumn(yearData) {
    let outPutObj = {};
    let columnNum = 1;
    let caption = null;
    for (let data of yearData) {
      let audited = (data.isAudited === false) ? 'حسابرسی نشده' : ((data.isAudited === true) ? 'حسابرسی شده': null);
      let date = data.periodEndToDate;
      caption = data.caption ? data.caption.match(/-/) ? data.caption.split('-')[0].match(/\//) ? data.caption.split('-')[1] : data.caption.split('-')[0] : caption : null;
      outPutObj['column_' + columnNum] = {};
      outPutObj['column_' + columnNum]['caption'] = caption ? (date + '-' + caption) : (audited ? (date + '-' + audited) : date);
      outPutObj['column_' + columnNum]['periodEndToDate'] = data.periodEndToDate;
      outPutObj['column_' + columnNum]['period'] = data.period;
      outPutObj['column_' + columnNum]['isAudited'] = data.isAudited;
      outPutObj['column_' + columnNum]['column'] =data.columnId?data.columnId:(data.columnName?data.columnName:null);
      outPutObj['column_' + columnNum]['fields'] = {};
      columnNum++;
    }
    return outPutObj;
  }

  async extractInfoArchive(requestData, type) {
    let defer = q.defer();
    BaseConfig.partLogger.event('object', 'extractInfoArchive', '    ---------------------    START extractInfoArchive    ---------------------       ');
    try {
      let today = moment(new Date()).format('jYYYYjMMjDD');
      let startDate = today;
      let endDate = today;
      if (requestData.endDate || requestData.startDate) {
        if (requestData.endDate >= requestData.startDate) {
          startDate = requestData.startDate;
          endDate = requestData.endDate;
        } else if (requestData.startDate) {
          startDate = requestData.startDate;
        } else if (requestData.endDate) {
          endDate = requestData.endDate;
        }
      }
      let types = [];
      let symbols = [];
      if (type != null) {
        types.push(type);
      } else {
        for (let item of BaseConfig.stmTypes) {
          types.push(item.name);
        }
      }
      async.eachSeries(types, async (type) => {
        let stmQuery = {
          type: type,
          date: {
            '$gte': startDate.replaceAll('/', ''),
            '$lte': endDate.replaceAll('/', '')
          },
          hasInfo: true
        };
        if (requestData.symbol) {
          symbols = (requestData.symbol + '').split(',');
        }
        if (symbols.length) {
          stmQuery['symbol'] = {};
          stmQuery['symbol'].$in = symbols;
        }
        let statements = await BaseConfig.mongoDBO.collection('CodalStatements').find(stmQuery, {
          fields: {
            tracingNo: 1,
            letterType: 1,
            symbol: 1
          }
        }).sort({'date': -1}).toArray();
        console.log('statements length extract Info type : ' + type, ' -> ', statements.length);
        for (let item of statements) {
          try {
            let info = await BaseConfig.mongoDBO.collection('statementsInfo')
              .find({tracingNo: item.tracingNo}).toArray();
            let infoObj = {
              info: info[0].info,
              letterType: item.letterType,
              tracingNo: item.tracingNo,
              symbol: item.symbol,
              type: type
            };
            infoObj.extractFields = await this.extractInfoFields(infoObj);
            let newFields = infoObj.extractFields;
            newFields.lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
            await BaseConfig.mongoDBO.collection('statementsInfo').updateOne(
              {tracingNo: infoObj.tracingNo},
              {
                $set: newFields
              },
              {upsert: true});
            utility.consoleLog(infoObj.tracingNo + ' extract Info ');
          }
          catch (e) {
            console.log(e, item.tracingNo);
          }
        }
      }, (error) => {
        if (error) {
          BaseConfig.partLogger.error('extractInfoArchive', error);
        } else {
          BaseConfig.partLogger.event('object', 'extractInfoArchive', '    ---------------------     END extractInfoArchive    ---------------------       ');
          defer.resolve();
        }
      });
    }
    catch (error) {
      BaseConfig.partLogger.error('extractInfoArchive', error);
    }
    return defer.promise;
  }

  async checkAndUpdateSymbolCalculatingType(symbol, type) {
    if (BaseConfig.typeQueries[type]) {
      if (BaseConfig.typeQueries[type].calculating) {
        BaseConfig.symbolList.forEach((item) => {
          if (item.symbol === symbol) {
            item.updateNeed = type;
          }
        });
        await BaseConfig.mongoDBO.collection('symbolList').updateOne(
          {symbol: symbol},
          {
            $set: {
              updateNeed: type
            }
          });
      }
    }
  }
}

module.exports = ExtractInfoFieldsBl;