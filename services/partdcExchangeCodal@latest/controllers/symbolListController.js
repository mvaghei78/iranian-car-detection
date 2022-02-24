/**
 * @namespace SymbolListController
 */
const BaseController = require('partServiceScaffoldModule').BaseController;
let SymbolListBL = require('../bussinessLogic/symbolListBl');

/**
 * @class SymbolListController
 * @memberOf SymbolListController
 * @description کنترل کردن نتیجه اجرای سرویس ها
 */
class SymbolListController extends BaseController {

  /**
   * @description دریافت لیست کلیه ی نماد های بورسی با درخواست به api های سهام
   * @returns {void}
   * @memberof StatementsBl
   */
  async getStockList() {
    try {
      this.sendOk(
        'سرویس ' + ('getStockList') + ' با موفقیت اجرا شد '
      );
      await new SymbolListBL().getStockList();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  /**
   * @description دریافت لیست صندوق ها از پروژه صندوق
   * @returns {Promise<void>}
   * @memberof mapFundsController
   */
  async getFundList() {
    try {
      this.sendOk(
        'سرویس ' + ('getFundList') + ' با موفقیت اجرا شد '
      );
      await new SymbolListBL().getFundList();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async updateSymbol() {
    try {
      let body = this.body ? this.body : {};
      let result = await new SymbolListBL().updateSymbol(body.symbolId, body.symbol);
      return this.sendResult(result);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
}

module.exports = SymbolListController;
