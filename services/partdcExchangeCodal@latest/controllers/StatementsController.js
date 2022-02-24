const BaseController = require('partServiceScaffoldModule').BaseController;
let {
  BaseConfig,
} = require('partdcFramework');
let StatementsBl = require('../bussinessLogic/StatementsBl');
/**
 * @class StatementsController
 * @extends {BaseController}
 */
class StatementsController extends BaseController {
  /**
   *
   * @description دریافت اطلاعیه های کدال در بازه درخواستی
   * @memberof StatementsBl
   * @returns {void}
   */
  async statements() {
    try {
      let Error403 = await BaseConfig.redisClient.get('Error403');
      if (Error403) {
        this.sendOk(
          'اجرای سرویس statements  تا پایان روز جاری متوقف خواهد بود'
        );
      }
      else {
        this.sendOk(
          'سرویس ' + ('statements') + ' با موفقیت اجرا شد '
        );
        await new StatementsBl().getCarsInfo(this.body.location);
      }
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async statementsArchive() {
    try {
      let date = this.body ? this.body.date ? this.body.date : null : null;
      this.sendOk('سرویس بررسی تعداد اطلاعیه ها (checkStatementsCounts) با موفقیت اجرا شد');
      await new StatementsBl().statementsArchive(date);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
  async checkStatementsCounts() {
    try {
      this.sendOk('سرویس بررسی تعداد اطلاعیه ها (checkStatementsCounts) با موفقیت اجرا شد');
      let limitCount = this.body  && this.body.limitCount ? +this.body.limitCount  : 5;
      await new StatementsBl().getBrandNames('75');
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
}

module.exports = StatementsController;