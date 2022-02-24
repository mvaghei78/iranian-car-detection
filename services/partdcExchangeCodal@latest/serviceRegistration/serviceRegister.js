let {
  BaseServiceContainer,

} = require('partdcFramework');



let statementsCodal = require('../services/statementsCodal');
let getStatementsInfoService = require('../services/getStatementsInfoService');
let codalStatementsLetterType = require('../services/codalStatementsLetterType');
let crawlStatementsSearchItems = require('../services/crawlStatementsSearchItems');
let codalStatementsPublishers = require('../services/codalStatementsPublishers');
let getStockList = require('../services/getStockList');
let getFundList = require('../services/getFundList');
/**
 * این کلاس به منظور رجیستر کردن کلیه سرویس های جدید در پروژه می باشد
 * هر کلاس جدیدی که  ایجاد می شود می بایست ابتدا ان را رجیستر کرد
 * وسپس متدهای مربوطه ان بازنویسی شود
 * 
 * @description
 * در صورتیکه یک متد قرار است در بازه های زمانی مختلف و با پارامترهای گوناگون فراخوانی شود
 * باتوجه به اینکه سامانه زمانبند اجازه درج نام های مشابه رو 
 *
 
 * @export
 * @class ServiceRegister
 */
class ServiceRegister {
  /**
   * ایجاد کلاس داده گیری بر اساس پارامترهای ورودی
   * @param {*} init
   * @returns
   * @memberof ServiceRegister
   */
  constructor(init=true) {
    this.serviceContainer = new BaseServiceContainer();
    if (init)
      this.init();
  }

  /**
   * ایجاد کلاس داده گیری بر اساس پارامترهای ورودی
   * همچون نام و ارسال سایر پارامترهای دریافتی ورودی  به  این کلاس
   * @param {*} requestData
   * @returns
   * @memberof ServiceRegister
   */
  getServiceClass(requestData) {
    return this.serviceContainer.resolve(requestData.serviceName)(requestData);
  }
  /**
   * ایجاد کلاس داده گیری بر اساس پارامترهای ورودی
   * @returns
   * @memberof ServiceRegister
   */
  init() {
    //========================= Service Registration ========================================

    this.serviceContainer.register('crawlStatementsSearchItems', (inputData) => {
      return new crawlStatementsSearchItems('crawlStatementsSearchItems', 'crawlStatementsSearchItems', inputData, 3);
    });
    this.serviceContainer.register('statement', (inputData) => {
      return new statementsCodal('statements', 'statements', inputData, 1);
    });
    this.serviceContainer.register('getStatementsInfoService', (inputData) => {
      return new getStatementsInfoService('getStatementsInfo', 'getStatementsInfo', inputData, 1);
    });

    this.serviceContainer.register('codalStatementsLetterType', (inputData) => {
      return new codalStatementsLetterType('codalStatementsLetterType', 'codalStatementsLetterType', inputData, 1);
    });
    this.serviceContainer.register('codalStatementsPublishers', (inputData) => {
      return new codalStatementsPublishers('codalStatementsPublishers', 'codalStatementsPublishers', inputData, 1);
    });
    this.serviceContainer.register('getStockList', (inputData) => {
      return new getStockList('getStockList', 'getStockList', inputData, 1);
    });
    this.serviceContainer.register('getFundList', (inputData) => {
      return new getFundList('getFundList', 'getFundList', inputData, 1);
    });
    //========================= Service Registration ========================================
  }
}


module.exports = ServiceRegister;