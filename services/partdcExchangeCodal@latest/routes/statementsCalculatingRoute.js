let statementsCalculatingController = require('../controllers/statementsCalculatingController');

let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');

/**
 * بازگردانی متد های مورد نیاز در کنترلر
 * @class InterimStatementsRoute
 * @extends {BaseRoute}
 */
class StatementsCalculatingRoute extends BaseRoute {
  /**
   * @description assign کردن روت ها به کنترلر
   * @memberOf InterimStatementsRoute
   * @returns {{interimStatement: {POST: {function: (function(*=, *=): *)}}, EPS: {POST: {function: (function(*=, *=): *)}}, stockList: {POST: {function: (function(*=, *=): *)}}, instrumentId: {POST: {function: (function(*=, *=): *)}},  symbolList: {POST: {function: (function(*=, *=): *)}} , getInfoInterimStatements: {POST: {function: (function(*=, *=): *)}}}}
   */
  getRoutes() {
    /**
     *
     * @param request
     * @param response
     * @returns {statementsCalculatingController}
     */
    const StatementsFactory = (request, response) => {
      return new statementsCalculatingController(request, response, BaseConfig);
    };
    return {
      statementsCalculating: {
        GET: {
          function: this.getAction(StatementsFactory, statementsCalculatingController.prototype.statementsCalculating.name)
        },
      },
      symbolCalculatingArchive: {
        GET: {
          function: this.getAction(StatementsFactory, statementsCalculatingController.prototype.symbolCalculatingArchive.name)
        },
      }
    };
  }
}

module.exports = StatementsCalculatingRoute;