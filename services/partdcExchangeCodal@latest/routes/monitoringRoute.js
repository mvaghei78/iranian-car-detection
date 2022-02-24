/**
 * @namespace monitoringRoute
 */
let MonitoringController = require('../controllers/monitoringController');
let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');

/**
 * @class MonitoringRoute
 */
class MonitoringRoute extends BaseRoute {
  /**
   *
   * @returns {{servicesMonitoring: {GET: {function: (function(...[*]=))}}, machineMonitoring: {GET: {function: (function(...[*]=))}}}}
   */
  getRoutes() {
    /**
     *
     * @param request
     * @param response
     * @returns {MonitoringController}
     */
    const factory = (request, response) => {
      return new MonitoringController(request, response, BaseConfig);
    };
    return {

      /////////////////////////////////// متد های مربوط به مانیتورینگ ////////////////////////////////////

      // بررسی بالا بودن ماشین
      machineMonitoring: {
        GET: {
          function: this.getAction(factory, MonitoringController.prototype.machineMonitoring.name)
        }
      },
      // بررسی بالا بودن سرویس های داده گیری
      servicesMonitoring: {
        GET: {
          function: this.getAction(factory, MonitoringController.prototype.servicesMonitoring.name)
        }
      },
    };
  }
}

module.exports = MonitoringRoute;