let {utilty} = require('../utility');
/**
 *@namespace crawlStatementsSearchItems
 */

let {
  BaseConfig,
  BaseServiceClass
} = require('partdcFramework');
let async = require('async');
let q = require('q');

/**
 * @class crawlStatementsSearchItems
 * @extends {BaseServiceClass}
 */
class crawlStatementsSearchItems extends BaseServiceClass {

  /**
   *Creates an instance of ExampleService.
   * @param {*} serviceName نام سرویس
   * @param {*} serviceRedisKey نام منحصر به فرد سرویس جهت ذخیره سازی در ردیس و عدم تکراری بودن فرایند اجرای ان
   * @param {*} inputParam پارامترهای دریافتی از کاربر
   * @param serviceCallMethod
   * @memberof crawlStatementsSearchItems
   */
  constructor(serviceName, serviceRedisKey, inputParam, serviceCallMethod) {
    super(serviceName, serviceRedisKey, inputParam, serviceCallMethod);
  }

  /**
   *
   * بازنویسی تنظیمات مرتبط با رست
   * این متد به ندرت استفاده می شود
   * @returns
   * @memberof crawlStatementsSearchItems
   */
  getCrawlRequestOption() {

    let crawlOption = super.getCrawlRequestOption();
    //این صفحه راهنمای استفاده از درگاه خدمات ارزش افزوده شرکت رایان بورس میباشد.
    crawlOption.url = 'https://help.rbcapi.ir/help/-1/34';
    crawlOption.timeout = 120000;
    // this.closePageOnEnd = true;
    return crawlOption;
  }

  /**
   * جهت پردازش داده های دریافتی متد ذیل می بایست پیاده سازی شود
   *
   * @memberof crawlStatementsSearchItems
   */
  async processData() {

    //دریافت دسته بندی های کلی شرکت ها
    // حاوی عددی است که نشان دهنده دسته بندی کلی شرکت در یکی از دسته های تولیدی، سرمایه گذاری، خدماتی، لیزینگ، بانک و ساختمانی است.
    let reportingTypes = await this.puppeteerPage.evaluate(() => {
      let lis = Array.from(document.querySelectorAll('#collapseEnum618 > table:nth-child(1) > tbody>tr'));
      if (lis.length > 0) {
        lis = lis.map(function (elm) {
          let text = elm.innerText;
          return {
            title: text.split('\t')[0],
            id: text.split('\t')[1],
          };
        });
        return lis;
      }
      else return [];
    });

    //دریافت عددی که نشان دهنده اصلاحی و یا اصل بودن اطلاعیه
    //اصلاحیه 	1
    // اصل 	0
    let letterKinds = await this.puppeteerPage.evaluate(() => {
      let lis = Array.from(document.querySelectorAll('#collapseEnum611 > table:nth-child(1) > tbody>tr'));
      if (lis.length > 0) {
        lis = lis.map(function (elm) {
          let text = elm.innerText;
          return {
            title: text.split('\t')[0],
            id: text.split('\t')[1],
          };
        });
        return lis;
      }
      else return [];
    });

    // حاوی عددی است که نوع شرکت را نشان می دهد
    //غیر از نهاد های مالی	0
    // سرمایه گذاری عام و هلدینگ عام	1
    //...
    let companyTypes = await this.puppeteerPage.evaluate(() => {
      let lis = Array.from(document.querySelectorAll('#collapseEnum604 > table:nth-child(1) > tbody>tr'));
      if (lis.length > 0) {
        lis = lis.map(function (elm) {
          let text = elm.innerText;
          return {
            title: text.split('\t')[0],
            id: text.split('\t')[1],
          };
        });
        return lis;
      }
      else return [];
    });

    //حاوی عددی است که وضعیت پذیرش شرکت را نشان می دهد
    //پذیرفته شده در بورس تهران	0
    // پذیرفته شده در فرابورس ایران	1
    //...
    let companyStates = await this.puppeteerPage.evaluate(() => {
      let lis = Array.from(document.querySelectorAll('#collapseEnum627 > table:nth-child(1) > tbody>tr'));
      if (lis.length > 0) {
        lis = lis.map(function (elm) {
          let text = elm.innerText;
          return {
            title: text.split('\t')[0],
            id: text.split('\t')[1],
          };
        });
        return lis;
      }
      else return [];
    });

    this.serviceData = {
      reportingTypes,
      letterKinds,
      companyTypes,
      companyStates
    };
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
   * @returns {void}
   * @memberof  crawlStatementsSearchItems
   */
  async saveData() {

    let searchItem = this.serviceData;
    if (searchItem) {
      let defer = q.defer();
      try {
        //ذخیره سازی تمام داده ها ی دریافتی در دیتا بیس
        async.eachOfSeries(searchItem, async (searchItem, key) => {
          await this.saveSearchItemsToMongo(searchItem, key);
        }, (error) => {
          if (error) {
            utilty.consoleLog('===============================');
            utilty.consoleLog('Error in outerSeries', error);
            utilty.consoleLog('===============================');
          }
          else
            defer.resolve();
        });
      }
      catch (e) {
        utilty.consoleLog(e);
        defer.reject(e);
      }
      return defer.promise;
    }

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
   * @returns {void}
   * @memberof  crawlStatementsSearchItems
   */
  async saveSearchItemsToMongo(searchItem, key) {
    let defer = q.defer();
    async.eachSeries(searchItem, async (item) => {
      // save data to mongo
      await BaseConfig.mongoDBO.collection(key).updateOne(
        {id: item.id},
        {
          $set:
          item
        },
        {upsert: true});
    }, (error) => {
      if (error) {
        utilty.consoleLog('===============================');
        utilty.consoleLog('Error in innerSeries', error);
        utilty.consoleLog('===============================');
        defer.reject();
      }
      else
        defer.resolve();
    });
    return defer.promise;
  }

}

module.exports = crawlStatementsSearchItems;