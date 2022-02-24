const BaseController = require('partServiceScaffoldModule').BaseController;
let {
  BaseConfig,
} = require('partdcFramework');

let SearchItemsBl = require('../bussinessLogic/SearchItemsBl');
/**
 * @class SearchItemsController
 * @extends {BaseController}
 */
class SearchItemsController extends BaseController {

  /**
   *
   *@description دریافت انواع اطلاعیه ها از api سامانه کدال
   * این سرویس با فراخوانی یک api از شرکت فرابورس به صورت rest داده های دریافتی را در مونگو ذخیره سازی میکند
   * @returns {void}
   * @memberof SearchItemsBl
   */
  async getStatementsLetterType() {
    try {
      let Error403 = await BaseConfig.redisClient.get('Error403');
      if (Error403) {
        this.sendOk(
          'اجرای سرویس getCodalStatementsLetterType  تا پایان روز جاری متوقف خواهد بود'
        );
      }
      else {
        this.sendOk(
          'سرویس ' + ('getCodalStatementsLetterType') + ' با موفقیت اجرا شد '
        );
        await new SearchItemsBl().getCodalStatementsLetterType(this.body);
      }
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
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
      this.sendOk(
        'سرویس ' + ('crawlStatementsSearchItems') + ' با موفقیت اجرا شد '
      );
      await new SearchItemsBl().crawlStatementsSearchItems(this.body);

    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
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

      this.sendOk(
        'سرویس ' + ('statementsCompanyIds') + ' با موفقیت اجرا شد '
      );
      await new SearchItemsBl().statementsCompanyIds();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
  /**
   *
   *@description دریافت ناشر ها از api کدال
   * @returns {void}
   * @memberof SearchItemsBl
   */
  async statementsPublishers() {
    try {

      this.sendOk(
        'سرویس ' + ('statementsPublishers') + ' با موفقیت اجرا شد '
      );
      await new SearchItemsBl().statementsPublishers();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }


}

module.exports = SearchItemsController;