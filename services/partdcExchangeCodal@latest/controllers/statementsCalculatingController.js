const BaseController = require('partServiceScaffoldModule').BaseController;
let moment = require('moment-jalaali');
let statementsCalculatingBl = require('../bussinessLogic/statementsCalculatingBl');

/**
 * @class InterimStatementsController
 * @extends {BaseController}
 */
class StatementsCalculatingController extends BaseController {
  /**
   * @description در این تابع جزویات اطلاعیه های مورد نیاز برای محاسبه EPS اطلاعیه ها دریافت می شود.
   * @returns {void}
   * @memberof InterimStatementsController
   */
  async statementsCalculating() {
    try {
      this.sendOk(
        'سرویس ' + ('statementsCalculating') + ' با موفقیت اجرا شد '
      );
      await new statementsCalculatingBl().statementsCalculating();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async symbolCalculatingArchive(){
    try {
      this.sendOk(
        'سرویس ' + ('statementsCalculatingArchive') + ' با موفقیت اجرا شد '
      );
      let requestStatementData = {};
      requestStatementData.startDate = this.body ? this.body.startDate ? this.body.startDate  : null : null;
      requestStatementData.endDate = this.body ? this.body.endDate ? this.body.endDate : null : null;
      requestStatementData.symbol = this.body ? this.body.symbol ? this.body.symbol : null : null;
      let type = this.body ? this.body.type ? this.body.type : null : null;
      let funcName = this.body ? this.body.funcName ? this.body.funcName : null : null;
      await new statementsCalculatingBl().symbolCalculatingArchive(requestStatementData,type,funcName);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
}

module.exports = StatementsCalculatingController;