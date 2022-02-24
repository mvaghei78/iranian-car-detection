/**
 * @namespace SymbolListRoute
 */
let SymbolListController = require('../controllers/symbolListController');
let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {BaseConfig} = require('partdcFramework');

/**
 * @class SymbolListRoute
 * @memberOf SymbolListRoute
 * @extends {BaseRoute}
 */
class SymbolListRoute extends BaseRoute {

  /**
   *  @memberOf serviceRoute
   * @returns {{DeleteData: {POST: {function: (function(*=, *=): *)}}, InsertData: {POST: {function: (function(*=, *=): *)}}, TradeOneDayAll: {GET: {function: (function(*=, *=): *)}}, getFutureMarketStatisticsService: {GET: {function: (function(*=, *=): *)}}, checkMachineStatus: {GET: {function: (function(*=, *=): *)}}, getFutureActiveContractsService: {GET: {function: (function(*=, *=): *)}}, getFutureContractsService: {GET: {function: (function(*=, *=): *)}}, addSellers: {GET: {function: (function(*=, *=): *)}}, warrantOfDeposit: {GET: {function: (function(*=, *=): *)}}, UpdateData: {POST: {function: (function(*=, *=): *)}}, checkPm2Status: {GET: {function: (function(*=, *=): *)}}, getMarketDataEkhtiiar: {GET: {function: (function(*=, *=): *)}}, getPooshalNeginSaffronService: {GET: {function: (function(*=, *=): *)}}, addBLackList: {GET: {function: (function(*=, *=): *)}}, getFutureMarketWatchService: {GET: {function: (function(*=, *=): *)}}}}
   */
  getRoutes() {
    /**
     *
     * @param request درخواست بدنه
     * @param response
     * @memberOf SymbolListRoute.SymbolListRoute
     * @returns {SymbolListController}
     */
    const factory = (request, response) => {
      return new SymbolListController(request, response, BaseConfig);
    };
    return {
      stockList:{
        GET: {
          function: this.getAction(factory, SymbolListController.prototype.getStockList.name)
        },
      },
      fundList: {
        GET: {
          function: this.getAction(factory, SymbolListController.prototype.getFundList.name)
        },
      },
      updateSymbol: {
        PUT: {
          function: this.getAction(factory, SymbolListController.prototype.updateSymbol.name)
        }
      }
    };
  }
}

module.exports = SymbolListRoute;
