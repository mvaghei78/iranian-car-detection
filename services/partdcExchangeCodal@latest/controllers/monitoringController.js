/**
 * @namespace monitoringController
 */
const BaseController = require('partServiceScaffoldModule').BaseController;
let MonitoringBl = require('../bussinessLogic/monitoringBl');

/**
 * @class MonitoringController
 * @description
 * در این کلاس کنترلر های مانیتورینگ را مشاهده می کنید
 */
class MonitoringController extends BaseController {

  /**
   * @summary مانیتورینگ ماشین
   * @memberOf monitoringController.MonitoringController
   * @return {Promise<void>}
   */
  async machineMonitoring() {
    try {
      let result = await new MonitoringBl().machineMonitoring();
      this.sendOk('مانیتورینگ وضعیت ماشین با موفقیت اجرا شد', result);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  /**
   * @summary مانیتورینگ سرویس ها
   * @memberOf monitoringController.MonitoringController
   * @return {Promise<void>}
   */
  async servicesMonitoring() {
    try {
      let result = await new MonitoringBl().servicesMonitoring();
      this.sendOk('مانیتورینگ سرویس های داده گیری  با موفقیت اجرا شد', result);
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
}

module.exports = MonitoringController;