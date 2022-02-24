/**
 * @namespace monitoringRoute
 */
let BasicPreparationsController = require('../controllers/basicPreparationsController');
let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');

/**
 * @class MonitoringRoute
 */
class BasicPreparationsRoute extends BaseRoute {
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
      return new BasicPreparationsController(request, response, BaseConfig);
    };
    return {
      // پر کردن جدول statementsCount با داده های codal360 و دیتابیس
      fillStatementsCount: {
        GET: {
          function: this.getAction(factory, BasicPreparationsController.prototype.fillStatementsCount.name)
        }
      },
      separatingInfoFromStatements: {
        GET: {
          function: this.getAction(factory, BasicPreparationsController.prototype.separatingInfoFromStatements.name)
        }
      },
      extractDataFromStatements: {
        GET: {
          function: this.getAction(factory, BasicPreparationsController.prototype.extractDataFromStatements.name)
        }
      },
    };
  }
}

module.exports = BasicPreparationsRoute;