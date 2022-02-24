let StatementsController = require('../controllers/StatementsController');
/**
 *@namespace StatementsRoute
 */

let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');
/**
 * بازگردانی متد های مورد نیاز در کنترلر
 * @class StatementsRoute
 * @extends {BaseRoute}
 */
class StatementsRoute extends BaseRoute {
  /**
   * @description assign کردن روت ها به کنترلر
   * @memberOf StatementsRoute
   * @returns {{statements: {POST: {function: (function(*=, *=): *)}}, getStatementsInfo: {POST: {function: (function(*=, *=): *)}}, addRecieveStatementsInfoLetterTypeList: {POST: {function: (function(*=, *=): *)}}, removeRecieveStatementsInfoLetterTypeList: {POST: {function: (function(*=, *=): *)}}, getRecieveStatementsInfoLetterTypeList: {POST: {function: (function(*=, *=): *)}}, getCollections: {GET: {function: (function(*=, *=): *)}}, updateSatatement: {POST: {function: (function(*=, *=): *)}}}}
   */
  getRoutes() {
    /**
     *
     * @param request
     * @param response
     * @returns {StatementsController}
     */
    const StatementsFactory = (request, response) => {
      return new StatementsController(request, response, BaseConfig);
    };
    return {
      //دریافت لیست اطلاعیه های کدال
      statements: {
        GET: {
          function: this.getAction(StatementsFactory, StatementsController.prototype.statements.name)
        }
      },
      statementsArchive: {
        GET: {
          function: this.getAction(StatementsFactory, StatementsController.prototype.statementsArchive.name)
        },
      },
      checkStatementsCounts: {
        GET: {
          function: this.getAction(StatementsFactory, StatementsController.prototype.checkStatementsCounts.name)
        },
      }
    };
  }
}

module.exports = StatementsRoute;