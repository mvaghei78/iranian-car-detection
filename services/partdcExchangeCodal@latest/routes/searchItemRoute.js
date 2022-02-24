let searchItemsController = require('../controllers/SearchItemsController');
let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');
  /**
   * بازگردانی متد های مورد نیاز در کنترلر
   * @class SearchItemRoute
   * @extends {BaseRoute}
   */
class SearchItemRoute extends BaseRoute {
  /**
   * @description assign کردن روت ها به کنترلر
   * @memberOf SearchItemRoute
   * @returns {{getStatementsLetterType: {POST: {function: (function(*=, *=): *)}}, crawlStatementsSearchItems: {POST: {function: (function(*=, *=): *)}}, statementsCompanyIds: {POST: {function: (function(*=, *=): *)}}, statementsPublishers: {POST: {function: (function(*=, *=): *)}}}}
   */
  getRoutes() {
    /**
     *
     * @param request
     * @param response
     * @returns {searchItemsController}
     */
    const searchItemsFactory = (request, response) => {
      return new searchItemsController(request, response, BaseConfig);
    };
    //این rout ها برای دریافت کلید های جستجو و تکمیل جدول شناسه و نام کلید های جستجو در دیتابیس ایجاد شده است
    // از این کلید ها برای جست جو در سرویس ارايه داده استفاده میشود
    return {
      //دریافت لیست انواع اطلاعیه های منتشر شده در سامانه کدال
      getStatementsLetterType: {
        GET: {
          function: this.getAction(searchItemsFactory, searchItemsController.prototype.getStatementsLetterType.name)
        },
      },
      //دریافت کلید های جست و جو وضعیت اطلاعیه ها ، دسته بندی کلی شرکت ها ، نوع شرکت و وضعیت پذیرش شرکت با استقاده از crawl میباشد.
      crawlStatementsSearchItems: {
        GET: {
          function: this.getAction(searchItemsFactory, searchItemsController.prototype.crawlStatementsSearchItems.name)
        },
      },
      // این سرویس نام شرکت ها را به همراه شناسه آن ها در دیتابیس ذخیره میکند.
      statementsCompanyIds: {
        GET: {
          function: this.getAction(searchItemsFactory, searchItemsController.prototype.statementsCompanyIds.name)
        },
      },
      statementsPublishers: {
        GET: {
          function: this.getAction(searchItemsFactory, searchItemsController.prototype.statementsPublishers.name)
        },
      }

    };
  }
}

module.exports = SearchItemRoute;