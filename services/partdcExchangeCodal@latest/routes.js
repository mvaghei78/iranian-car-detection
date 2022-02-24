/**
 * @namespace Routes
 * */
let statementsRoute = require('./routes/statementsRoute');
let statementsInfoRoute = require('./routes/statementsInfoRoute');
let searchItemRoute = require('./routes/searchItemRoute');
let StatementsCalculatingRoute = require('./routes/statementsCalculatingRoute');
let MonitoringRoute  = require('./routes/monitoringRoute');
let SymbolListRoute = require('./routes/symbolListRoute');
let BasicPreparationsRoute = require('./routes/basicPreparationsRoute');
let crudStatementsRoute = require('./routes/crudStatementRoute');
let ServiceManagementRoute = require('partdcServiceManagementModule').ServiceManagementRoute;
let {
  BaseConfig,
} = require('partdcFramework');
/**
 * @description تمامی root های پروژه در اینجا باید require بشوند
 * @memberOf Routes
 */
class Routes {
  /**
   * @description root های پروژه
   * @returns {{functons}}
   */
  getRoutes() {
    return {
      ...new searchItemRoute().getRoutes(),
      ...new statementsRoute().getRoutes(),
      ...new StatementsCalculatingRoute().getRoutes(),
      ...new MonitoringRoute().getRoutes(),
      ...new SymbolListRoute().getRoutes(),
      ...new BasicPreparationsRoute().getRoutes(),
      ...new statementsInfoRoute().getRoutes(),
      ...new crudStatementsRoute().getRoutes(),
      ...new ServiceManagementRoute().getRoutes(
        BaseConfig
      )
    };
  }
}

module.exports = Routes;