let utility = require('../utility');

/**
 * @namespace codalStatementsLetterType
 */
let {
  BaseConfig,
  BaseServiceClass
} = require('partdcFramework');
let async = require('async');
let q = require('q');


/**
 *
 * @class codalStatementsLetterType
 * @extends {BaseServiceClass}
 */
class codalStatementsPublishers extends BaseServiceClass {


  /**
   *Creates an instance of ExampleService.
   * @param {!string} serviceName نام سرويس
   * @param {!string} serviceRedisKey نام منحصر به فرد سرويس جهت ذخيره سازي در رديس و عدم تکراري بودن فرايند اجراي ان
   * @param {object} inputParam پارامترهاي دريافتي از کاربر
   * @param {number} serviceCallMethod
   * @memberof  codalStatementsLetterType
   */
  constructor(serviceName, serviceRedisKey, inputParam, serviceCallMethod) {
    super(serviceName, serviceRedisKey, inputParam, serviceCallMethod);
  }

  /**
   *@description بازنويسي تنظيمات مرتبط با رست
   * @returns {!object} تنظیمات درخواست رست
   * @memberof  codalStatementsLetterType
   */
  getRestRequestOptions() {
    let options = super.getRestRequestOptions();
    options.url = 'https://api.rbcapi.ir/codal/publishers';
    options.headers.Authorization =  "Bearer " + BaseConfig.token;
    options.rejectUnauthorized = false;
    options.resolveWithFullResponse = true;
    return options;
  }


  /**
   * جهت پردازش داده هاي دريافتي متد ذيل مي بايست پياده سازي شود
   * @returns {void}
   * @memberof  codalStatementsLetterType
   */
  async processData() {
    let data = this.serviceData;
    if (data.hasOwnProperty('Error')) {
      //خطا را در متغیر this.logSystem.logClass گذاشته
      this.logSystem.logClass.codalError = data;
      // و به بیزینس لاجیک برمیگردانیم
      throw Error(data);
    }
    // اگر خطا نداشته باشیم :
    else {
      let result = [];
      data.forEach(item => {
        result.push(item);
      });
      this.serviceData = result;
      BaseConfig.publisher = result;
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
   * @memberof  codalStatementsLetterType
   */
  async saveData() {
    let data = this.serviceData;
    if (data) {
      let defer = q.defer();
      try {
        async.eachSeries(data, async (item) => {
          // save data to mongo
          await BaseConfig.mongoDBO.collection('publishers').updateOne(
            {id: item.id},
            {
              $set:
                item
            },
            {upsert: true});
        }, (error) => {
          if (error) {
            utility.consoleLog('===============================');
            utility.consoleLog('Error in innerSeries', error);
            utility.consoleLog('===============================');
          }
          else
            defer.resolve();
        });
      }
      catch (e) {
        utility.consoleLog(e);
        defer.reject(e);
      }
      return defer.promise;
    }

  }
}

module.exports = codalStatementsPublishers;