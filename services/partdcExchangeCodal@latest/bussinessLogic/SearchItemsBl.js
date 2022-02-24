/**
 * @namespace SearchItemsBl
 */
let { BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig,
  DCManager,
} = require('partdcFramework');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let q = require('q');
let async = require('async');
let ServiceRegister = require('../serviceRegistration/serviceRegister');
let initializer = require('./../initializer')


/**
 * @class SearchItemsBl
 * @extends {BaseBussinessLogic}
 */
class SearchItemsBl extends BaseBussinessLogic {
  /**
   *
   *@description دریافت انواع اطلاعیه ها از api سامانه کدال
   * این سرویس با فراخوانی یک api از شرکت فرابورس به صورت rest داده های دریافتی را در مونگو ذخیره سازی میکند
   * @returns {void}
   * @memberof SearchItemsBl
   */
  async getCodalStatementsLetterType() {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceClass;
      let serviceModel = {};
      //سرویس دریافت عنوان نوع اطلاعیه ها
      serviceModel.serviceName = 'codalStatementsLetterType';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      let DC = await new DCManager(serviceModel, serviceClass).run();
      if (!DC.saveDone) {
        if (DC.codalError){
          let info = DC.codalError;
          let statusCode = info ? (info.StatusCode ? info.StatusCode : info) : 200;
          //به دلیل محدودیت در ارسال تعداد درخواست به سرور رایان بورس در صورتی که تعداد مجاز درخواست ها به پایان رسیده باشد سرویس باید تا پایان روز متوقف گردد بدین منظور در ردیس کلیدی را ست میکنیم که در پایان روز از بین خواهد رفت
          if (statusCode === 403) {
            var todayEnd = new Date().setHours(23, 59, 59, 999);
            BaseConfig.redisClient.set('Error403', new Date());
            BaseConfig.redisClient.expireat('Error403', parseInt(todayEnd / 1000));
            BaseException.raiseError('سرویس تا پایان روز جاری متوقف خواهد بود !!!', 'خطا در عملیات داده گیری');
          }
          else if (statusCode === 401 || statusCode === 404) {
            // در صورت نا معتبر بودن توکن تاکن حذف خواد شد و در اجرای بعدی سرویس فریم ورک داده گیری به خاطر وجود نداشتن توکن ابتدا سعی در دریافت توکن جدید میکند
            await initializer.getTokenRayanBourse();
            BaseException.raiseError('توگن نا معتبر است', 'خطا در عملیات داده گیری');
          }
        }
        else {
          BaseException.raiseError(DC.error.message, 'خطا در عملیات داده گیری');
        }
      }
    }
    catch (error) {
      console.log('errroor');
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  /**
   *
   *@description  دریافت کلید های جست و جو وضعیت اطلاعیه ها ، دسته بندی کلی شرکت ها ، نوع شرکت و وضعیت پذیرش شرکت با استقاده از crawl میباشد.
   * این سرویس با crawl کردن صفحه ی help سایت شرکت رایان بورس کلید های نام برده سده را به همراه مقادیر آن ها دریافت و در مونگو ذخیره سازی میکند
   * @returns {void}
   * @memberof SearchItemsBl
   */
  async crawlStatementsSearchItems() {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceClass;
      let serviceModel = {};
      // سرویس خزش سایت راهنمای وب سرویس رایان بورس برای دریافت کلید های جست جو
      serviceModel.serviceName = 'crawlStatementsSearchItems';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      await new DCManager(serviceModel, serviceClass).run();
    }
    catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  /**
   *
   *@description  این سرویس نام شرکت ها را به همراه شناسه آن ها در دیتابیس ذخیره میکند.
   * این سرویس با پیمایش پایگاه داده تمامی شناسه شرکت ها و نام شرکت هارا پردازش و در پایگاه داده ذخیره میکند
   * @returns {void}
   * @memberof SearchItemsBl
   */
  async statementsCompanyIds() {
    try {

      // دریافت تمام شناسه ی های ذخیره شده در جدول شناسه شرکت ها
      let existsCompanyIDs = await BaseConfig.mongoDBO.collection('companyIds')
        .find(
          {}
        ).toArray();
      existsCompanyIDs = existsCompanyIDs.map(item=>{
        return item.id;
      });

      // دریافت تمام شناسه شرکت های موجود در اطلاعیه های روی دیتا ست
      let allCompanyIDs = await BaseConfig.mongoDBO.collection('CodalStatements')
        .distinct('data.companyId');

      // بدست اوردن شناسه شرکت هایی که در دیتابیس اطلاعیه ها موجود میباشد اما در دیتابیس جدول شناسه شرکت ها موجود نمیباشد
      let diff = this.arr_diff(allCompanyIDs,existsCompanyIDs);
      if(diff.length>0){
        // در صورت وجود ذخیره سازی ان ها به همراه نام شرکت در دیتابیس جدول شناسه شرکت ها
        await this.saveNewCompanyIds(diff);
      }

    }
    catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  /**
   *
   * @description این متد شناسه شرکت های جدید را در دیتابیس ذخیره میکند
   * @param {Object[]} diff
   * @returns {promise}
   * @memberof SearchItemsBl
   */
  saveNewCompanyIds(diff){
    let defer=q.defer();
    // ذخیره تمام شناسه شرکت ها به همراه نام آنها در پایگاه داده
    async.eachSeries(diff,async(item)=>{
      let newCompanyName = await  BaseConfig.mongoDBO.collection('CodalStatements')
        .find({'data.companyId':item})
        .toArray();
      newCompanyName = newCompanyName[0].data.companyName;
      await BaseConfig.mongoDBO.collection('companyIds')
        .updateOne(
          {id:item},
          {$set:{
            id:item,
            title:newCompanyName
          }
          },
          {upsert:true}
        );
    },e=>{
      if (e){
        defer.reject();
      }
      else
        defer.resolve();
    });
    return defer.promise;
  }

  /**
   * @description این متد اختلاف دو آرایه را بر میگرداند .
   * @param {![]} a1
   * @param {![]} a2
   * @returns {[]}
   * @memberof SearchItemsBl
   */
  arr_diff (a1, a2) {

    var a = []; var diff = [];

    for (var j= 0; j < a1.length; j++) {
      a[a1[j]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
      if (a[a2[i]]) {
        delete a[a2[i]];
      }
      else {
        a[a2[i]] = true;
      }
    }

    for (var k in a) {
      if (a.hasOwnProperty(k)){
        diff.push(parseInt(k));
      }
    }

    return diff;
  }

  /**
   * @description در این متد سرویس دریافت داده های ناشران دریافت می شود.
   * @returns {[]}
   * @memberof SearchItemsBl
   */
  async statementsPublishers() {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceClass;
      let serviceModel = {};
      //سرویس دریافت عنوان نوع اطلاعیه ها
      serviceModel.serviceName = 'codalStatementsPublishers';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      let DC = await new DCManager(serviceModel, serviceClass).run();
      if (!DC.saveDone) {
        if (DC.codalError){
          let info = DC.codalError;
          let statusCode = info ? (info.StatusCode ? info.StatusCode : info) : 200;
          //به دلیل محدودیت در ارسال تعداد درخواست به سرور رایان بورس در صورتی که تعداد مجاز درخواست ها به پایان رسیده باشد سرویس باید تا پایان روز متوقف گردد بدین منظور در ردیس کلیدی را ست میکنیم که در پایان روز از بین خواهد رفت
          if (statusCode === 403) {
            var todayEnd = new Date().setHours(23, 59, 59, 999);
            BaseConfig.redisClient.set('Error403', new Date());
            BaseConfig.redisClient.expireat('Error403', parseInt(todayEnd / 1000));
            BaseException.raiseError('سرویس تا پایان روز جاری متوقف خواهد بود !!!', 'خطا در عملیات داده گیری');
          }
          else if (statusCode === 401 || statusCode === 404) {
            // در صورت نا معتبر بودن توکن تاکن حذف خواد شد و در اجرای بعدی سرویس فریم ورک داده گیری به خاطر وجود نداشتن توکن ابتدا سعی در دریافت توکن جدید میکند
            await initializer.getTokenRayanBourse();
            BaseException.raiseError('توگن نا معتبر است', 'خطا در عملیات داده گیری');
          }
        }
        else {
          BaseException.raiseError(DC.error.message, 'خطا در عملیات داده گیری');
        }
      }
    }
    catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

}

module.exports = SearchItemsBl;
