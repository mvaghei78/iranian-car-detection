/**
 * @namespace CrudController
 */
const BaseController = require('partServiceScaffoldModule').BaseController;
let CrudBl = require('../bussinessLogic/crudStatementBl');

/**
 * @description کنترلر مربوط به عملیات crud
 * @memberof CrudController
 */
class CrudController extends BaseController {
  /**
   * @summary فراخوانی لیست اخبار
   * @returns {object[]}
   * @memberof CrudController
   * @function getCollections
   */
  async getCollections() {
    try {
      let res = await new CrudBl().getCollections();
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }

  /**
   * @summary find in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async find() {
    try {
      let res = await new CrudBl().find(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }

  }

  /**
   * @summary count in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async count() {
    try {
      let res = await new CrudBl().count(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }

  /**
   * @summary updateOne in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async updateOne() {
    try {

      let res = await new CrudBl().updateOne(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }
  /**
   * @summary updateMany in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async updateMany() {
    try {
      let res = await new CrudBl().updateMany(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }

  /**
   * @summary deleteOne in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async deleteOne() {
    try {
      let res = await new CrudBl().deleteOne(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }

  /**
   * @summary deleteMany in mongodb
   * @memberof CrudController
   * @returns {Promise<void>}
   */
  async deleteMany() {
    try {
      let res = await new CrudBl().deleteMany(this.body);
      return this.sendResult(res);
    }
    catch (error) {
      return this.sendFail(error, error);
    }
  }

}

module.exports = CrudController;
