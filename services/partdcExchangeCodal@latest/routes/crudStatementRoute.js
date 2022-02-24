/**
 * @namespace CrudRoutes
 */
let CrudController = require('../controllers/crudStatementController');
let BaseRoute = require('partServiceScaffoldModule').BaseRoute;
let {
  BaseConfig
} = require('partdcFramework');


/**
 * @description root مربوط به عملیات crud
 * @memberOf CrudRoutes
 */
class CrudRoutes extends BaseRoute {
  /**
   * @description assign کردن روت ها به کنترلر
   * @memberOf CrudRoutes
   * @returns {{updateMany: {POST: {function: (function(*=, *=): *)}}, find: {POST: {function: (function(*=, *=): *)}}, count: {POST: {function: (function(*=, *=): *)}}, getCollections: {GET: {function: (function(*=, *=): *)}}, updateOne: {POST: {function: (function(*=, *=): *)}}}}
   */
  getRoutes() {
    /**
     *
     * @param request
     * @param response
     * @returns {CrudController}
     */
    const factory = (request, response) => {
      return new CrudController(request, response, BaseConfig);
    };
    return {

      getCollections: {
        /**
         * @description گرفتن کالکشن مونگو
         * @method GET
         * @memberOf CrudRoutes
         */
        GET: {
          function: this.getAction(factory, CrudController.prototype.getCollections.name)
        }
      },
      find: {
        /**
         * @description کوئری find  در مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.find.name),
        }
      },
      count: {
        /**
         * @description گرفتن count از کوئری مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.count.name),
        }
      },
      updateOne: {
        /**
         * @description آپدیت در مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.updateOne.name)
        }
      },
      updateMany: {
        /**
         * @description آپدیت چندتایی در مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.updateMany.name)
        }
      },
      deleteOne: {
        /**
         * @description حذف  از مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.deleteOne.name),
        }
      },
      deleteMany: {
        /**
         * @description حذف چندتایی از مونگو
         * @method POST
         * @memberOf CrudRoutes
         */
        POST: {
          function: this.getAction(factory, CrudController.prototype.deleteMany.name),
        }
      }
    };
  }
}

module.exports = CrudRoutes;
