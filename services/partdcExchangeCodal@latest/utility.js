
let {
  BaseConfig,
} = require('partdcFramework');
let us = require('underscore');
let requestPromise = require('request-promise');


/**
 * کلاس توابع مورد استفاده
 */
class Utility{
  /**
   * تابع چاپ لاگ ها
   * @param msg
   */
  static consoleLog(...msg){
    // eslint-disable-next-line no-console
    console.log(...msg);
  }

  /**
   * تابع جهت انگلیسی نمودن متن فارسی
   * @param data
   * @returns {*}
   */
  static finglishIt(data){
    return data.replace(/،*\s/g, '')
      .replace(/(-)/g, '')
      .replace(/(\.)/g, '')
      .replace(/(\+)/g, '')
      .replace(/(?:\d)?\d+/g, '')
      .replace(/(,)/g, '')
      .replace(/(ّ)/g, '')
      .replace(/(ِ)/g, '')
      .replace(/(َ)/g, '')
      .replace(/(ٍ)/g, '')
      .replace(/(ء)/g, '')
      .replace(/(ِ)/g, '')
      .replace(/(ٌ)/g, '')
      .replace(/(ـ)/g, '')
      .replace(/(ُ)/g, '')
      .replace(/(ْ)/g, '')
      .replace(/(ً)/g, '')
      .replace(/(\/)/g, '')
      .replace(/(\\)/g, '')
      .replace(/(")/g, '')
      .replace(/(،)/g, '')
      .replace(/(إٔ)/g, 'a')
      .replace(/(اِ)/g, 'a')
      .replace(/(ا)/g, 'a')
      .replace(/(اِ)/g, 'a')
      .replace(/(أ)/g, 'a')
      .replace(/(إ)/g, 'a')
      .replace(/(آ)/g, 'a')
      .replace(/(ب)/g, 'b')
      .replace(/(ت)/g, 't')
      .replace(/(ث)/g, 's')
      .replace(/(پ)/g, 'p')
      .replace(/(ج)/g, 'j')
      .replace(/(چ)/g, 'c')
      .replace(/(ح)/g, 'h')
      .replace(/(خ)/g, 'kh')
      .replace(/(د)/g, 'd')
      .replace(/(ذ)/g, 'z')
      .replace(/(ر)/g, 'r')
      .replace(/(ز)/g, 'z')
      .replace(/(ژ)/g, 'zh')
      .replace(/(س)/g, 's')
      .replace(/(ش)/g, 'sh')
      .replace(/(ص)/g, 's')
      .replace(/(ض)/g, 'z')
      .replace(/(ط)/g, 't')
      .replace(/(ظ)/g, 'z')
      .replace(/(ڤ)/g, 'f')
      .replace(/(ع)/g, 'i')
      .replace(/(غ)/g, 'gh')
      .replace(/(ف)/g, 'f')
      .replace(/(ق)/g, 'gh')
      .replace(/(ک)/g, 'k')
      .replace(/(گ)/g, 'g')
      .replace(/(ل)/g, 'l')
      .replace(/(م)/g, 'm')
      .replace(/(ن)/g, 'n')
      .replace(/(و)/g, 'v')
      .replace(/(ه)/g, 'h')
      .replace(/(ی)/g, 'i')
      .replace(/(ي)/g, 'i')
      .replace(/(ى)/g, 'i')
      .replace(/(ك)/g, 'k')
      .replace(/(ئ)/g, 'i')
      .replace(/(ؤ)/g, 'v')
      .replace(/(ة)/g, 'h')
      .replace(/(هٔ)/g, 'h');
  }

  static async getToken(){
    try {
      let options = {
        method: 'POST',
        url: 'https://api.rbcapi.ir/login/',
        headers: {
          'Content-Type': 'application/json',
          userKey: '995a101009eac420a271f403b59d964974a9acb4'
        },
        rejectUnauthorized: false,
        body: {
          Username: 'partfip.user',
          Password: 'partfip@user123',
          ProjectCode: '1002'
        },
        json: true,
        resolveWithFullResponse: true
      };
      const result = await requestPromise(options)
      if (result) {
        BaseConfig.redisClient.set('Token', result.body);
        return result.body;
      }
    } catch (error) {
      utility.consoleLog(error, "ارسال درخواست", "ایجادتوکن");
    }
  }

  /**
   * @description بدست اوردن ارایه ی نماد ها بر اساس اطلاعیه دریافتی و لیست نماد ها
   * در این تابع ابجکتی از نماد هایی که در لیت اطلاعیه های ورودی بوده و نماد ها جزو لیست نماد ها هستند در خروجی داده می شود.
   * @param {!object} statements اطلاعیه ورودی
   * @param {!Array}  allSymbols لیست نماد ها
   * @returns {object} obj
   */
  static groupBySymbols(statements, allSymbols){
    let obj = {};
    statements.forEach((item) => {
      let symbol = item.data.symbol;
      if (allSymbols[symbol]) {
        if (!obj.hasOwnProperty(symbol)) {
          obj[symbol] = allSymbols[symbol];
        }
      }
    });
    return obj;
  }

  /**
   * تابع گروپ برای کلید های داخلی در اطلاعیه ها
   * @param inputArr
   * @param key
   * @returns {{}}
   */
  static groupByKey(inputArr,key){
    let obj = {};
    inputArr.forEach((item) => {
      let x = item.data[key];
      if (!obj.hasOwnProperty(x)) {
        obj[x] = [];
        obj[x].push(item);
      }
    });
    return obj;
  }

  static groupByPdate(allStatements){
    let statementsObj = us.groupBy(allStatements, 'periodEndToDate');
    for (let item in statementsObj) {
      let newItem = item.replaceAll('/', '').substring(0, 6);
      statementsObj[newItem] = statementsObj[item];
        if (statementsObj[newItem].length>1){
        for (let stm of statementsObj[newItem]){
          if (stm.isConsolidated){
            let index = statementsObj[newItem].indexOf(stm);
            let arrIndex = allStatements.indexOf(stm);
            statementsObj[newItem].splice(index, 1);
            allStatements.splice(arrIndex,1);
          }
        }
      }
      delete statementsObj[item];
    }
    return {statementsObj,allStatements}
  }

  static createStatementObj(newStm){
    let stmModel = {
      'tracingNo' :newStm.tracingNo,
      'symbol' :newStm.symbol,
      'letterSymbol' :newStm.letterSymbol,
      'parentTracingNo' :newStm.parentTracingNo,
      'title' :newStm.title,
      'date' :newStm.date,
      'hasInfo' :newStm.hasInfo,
      'contentNeed' :newStm.contentNeed,
      'type' :newStm.type ? newStm.type : '',
      'registerDatetime' :newStm.registerDatetime,
      'sentDateTime' :newStm.sentDateTime,
      'publishDateTime' :newStm.publishDateTime,
      'letterCode' :newStm.letterCode,
      'reportingType' :newStm.reportingType,
      'letterName' :newStm.letterName,
      'letterType' :newStm.letterType,
      'letterKind' :newStm.letterKind,
      'isAudited' :newStm.isAudited,
      'isConsolidated' :newStm.isConsolidated,
      'period' :newStm.period,
      'periodExtraDay' :newStm.periodExtraDay,
      'periodEndToDate' :newStm.periodEndToDate,
      'yearEndToDate' :newStm.yearEndToDate,
      'hasAttachment' :newStm.hasAttachment,
      'companyType' :newStm.companyType,
      'companyName' :newStm.companyName,
      'companyState' :newStm.companyState,
      'htmlUrl' :newStm.htmlUrl,
      'pdfUrl' :newStm.pdfUrl,
      'excelUrl' :newStm.excelUrl,
      'xbrlUrl' :newStm.xbrlUrl,
      'attachmentUrl' :newStm.attachmentUrl,
      'contentUri' :newStm.contentUri,
      'companyId' :newStm.companyId,
      'auditorId' :newStm.auditorId,
      'finglishSymbol' :newStm.finglishSymbol
    };
    return stmModel;
  }

  static addNewStmToLocalVariable(newStm){
    let stmSearch = BaseConfig.statements.find(e => {
      return e.tracingNo === newStm.tracingNo;
    });
    if (!stmSearch){
      BaseConfig.statements.push({
        symbol : newStm.symbol,
        tracingNo : newStm.tracingNo,
        contentNeed : newStm.contentNeed,
        type : newStm.type,
        hasInfo : newStm.hasInfo
      });
    }
    else {
      let foundIndex = BaseConfig.statements.indexOf(stmSearch);
      BaseConfig.statements[foundIndex] = newStm;
    }
  }

  static async updateDB(stm){
    await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
      { tracingNo: stm.tracingNo},
      { $set: stm},
      {upsert: true});
  }

  static addNewSymbolToLocalVariable(newSymbol){
    let symbolSearch = BaseConfig.symbolList.find(e => {
      return e.symbolId === newSymbol.symbolId;
    });
    if (!symbolSearch){
      BaseConfig.symbolList.push(newSymbol);
    }
    else{
      let foundIndex = BaseConfig.symbolList.indexOf(symbolSearch);
      BaseConfig.symbolList[foundIndex] = newSymbol;
    }
  }
}

module.exports = Utility;
