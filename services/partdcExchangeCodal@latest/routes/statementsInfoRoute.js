let StatementsInfoController = require('../controllers/statementsInfoController');
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
class StatementsInfoRoute extends BaseRoute {
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
      return new StatementsInfoController(request, response, BaseConfig);
    };
    return {
      statementsInfo: {
        GET: {
          function: this.getAction(StatementsFactory, StatementsInfoController.prototype.getStatementsInfo.name)
        },
      },
      extractInfoArchive: {
        GET: {
          function: this.getAction(StatementsFactory, StatementsInfoController.prototype.extractInfoArchive.name)
        },
      },
      setStatementsTypeArchive:{
        GET: {
          function: this.getAction(StatementsFactory, StatementsInfoController.prototype.setStatementsTypeArchive.name)
        },
      },
      reTryFailInfo : {
        GET: {
          function: this.getAction(StatementsFactory, StatementsInfoController.prototype.reTryFailInfo.name)
        },
      }
    };
  }
}

module.exports = StatementsInfoRoute;