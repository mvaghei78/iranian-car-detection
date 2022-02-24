/**
 *@namespace getStatementsInfoService
 */



let {
  BaseConfig,
  BaseServiceClass
} = require('partdcFramework');
let utility = require('../utility');
let moment = require('moment-jalaali');


/**
 * @class getStatementsInfoService
 * @extends {BaseServiceClass}
 */
class getStatementsInfoService extends BaseServiceClass {


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
    if (process.env.mode === 'prod'){
      options.url = this.inputParam.contentUri;
      options.headers.Authorization =  "Bearer " + BaseConfig.token;
    }
    else{
      options.url =  'https://partfdfExchangeCodal.partdp.ir/service/partfdfExchangeCodal@latest/statementInfo?tracing_number=' + `${this.inputParam.tracingNo}`;
    }
    options.rejectUnauthorized = false;
    options.resolveWithFullResponse = true;
    return options;
  }

  /**
   * @description جهت پردازش داده هاي دريافتي متد ذيل مي بايست پياده سازي شود
   * @memberof  getStatementsInfoService
   * @returns {void}
   */
  async processData() {
    if (process.env.mode !== 'prod'){
      this.serviceData = this.serviceData.data.result;
    }
    let data = this.serviceData;
    // مقایسه لیست اطلاعیه های دریافتی در این روز با لیست اطلاعیه های موجود در پایگاه داده در این روز
    // اطلاعیه هایی که در پایگاه داده موجود باشند فیلتر میشوند و حذف میگردند
    if (data.hasOwnProperty('Error')) {
      this.logSystem.logClass.codalError = data;
      this.logSystem.logClass.statementInfo = null;
      throw Error(data);
    }
    // else{
    // if (this.inputParam.tracingNo === 703652){
    //   this.logSystem.logClass.codalError = data;
    //   this.logSystem.logClass.statementInfo = null;
    //   // this.serviceData.data.result = null;
    // }
    else
      this.logSystem.logClass.statementInfo = data;
    // }
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
    let data = this.serviceData;
    try {
      if (!data.hasOwnProperty('message')) {
        let lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
        let result = await BaseConfig.mongoDBO.collection('statementsInfo').updateOne(
          {tracingNo: this.inputParam.tracingNo},
          {
            $setOnInsert : {  //TODO بررسی
              info: data,
              lastUpdateDateTime : lastUpdateDateTime
            }
          },
          {upsert: true});
        if (result.result.ok){
          await BaseConfig.mongoDBO.collection('infoError').remove({tracingNo: this.inputParam.tracingNo});
        }
      }

    }
    catch (e) {
      utility.consoleLog(e);
    }

  }
}

module.exports = getStatementsInfoService;