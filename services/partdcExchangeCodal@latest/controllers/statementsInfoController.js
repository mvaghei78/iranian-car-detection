const BaseController = require('partServiceScaffoldModule').BaseController;
let {
  BaseConfig,
} = require('partdcFramework');
let StatementsInfoBl = require('../bussinessLogic/statementsInfoBl');
let extractInfoFields = require('../bussinessLogic/extractInfoFields');

/**
 * @class StatementsController
 * @extends {BaseController}
 */
class StatementsInfoController extends BaseController {
  /**
   * @description بازگردانی جزعیات اطلاعیه ی کدال برای فیلتر های اعمال شده
   * @returns {void}
   * @memberof StatementsBl
   */
  async getStatementsInfo() {
    try {
      let Error403 = await BaseConfig.redisClient.get('Error403');
      if (Error403) {
        this.sendOk(
          'اجرای سرویس getStatementsInfo  تا پایان روز جاری متوقف خواهد بود'
        );
      }
      else {
        this.sendOk(
          'سرویس ' + ('getStatementsInfo') + ' با موفقیت اجرا شد '
        );
        await new StatementsInfoBl().getStatementsInfo();
      }
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async extractInfoArchive(){
    try {
      this.sendOk('سرویس بررسی تعداد اطلاعیه ها (extractInfoFields) با موفقیت اجرا شد');
      let requestStatementData = {};
      requestStatementData.startDate = this.body ? this.body.startDate ? this.body.startDate  : null : null;
      requestStatementData.endDate = this.body ? this.body.endDate ? this.body.endDate : null : null;
      let type = this.body ? this.body.type ? this.body.type : null : null;
      requestStatementData.symbol = this.body ? this.body.symbol ? this.body.symbol : null : null;
      await new extractInfoFields().extractInfoArchive(requestStatementData,type);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async setStatementsTypeArchive(){
    try {
      this.sendOk('سرویس بررسی تعداد اطلاعیه ها (setStatementsTypeArchive) با موفقیت اجرا شد');
      let requestStatementData = {};
      requestStatementData.startDate = this.body ? this.body.startDate ? this.body.startDate.replaceAll('/','')  : null : null;
      requestStatementData.endDate = this.body ? this.body.endDate ? this.body.endDate.replaceAll('/','') : null : null;
      let type = this.body ? this.body.type ? this.body.type : null : null;
      let symbol = this.body ? this.body.symbol ? this.body.symbol : null : null;
      await new StatementsInfoBl().setStatementsTypeArchive(requestStatementData,type,symbol);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async reTryFailInfo(){
    try {
      this.sendOk('سرویس بررسی تعداد اطلاعیه ها (reTryFailInfo) با موفقیت اجرا شد');
      let tracingNo = this.body ? this.body.tracingNo ? this.body.tracingNo : null : null;
      let date = this.body ? this.body.date ? this.body.date : null : null;
      await new StatementsInfoBl().reTryFailInfo(date,tracingNo);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
}

module.exports = StatementsInfoController;