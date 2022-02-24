/**
 * @namespace CrudBl
 */
let {BaseBussinessLogic,BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig
} = require('partdcFramework');
/**
 * @description bl مربوط به عملیات crud
 * @memberOf CrudBl
 */
class CrudBl extends BaseBussinessLogic {

  /**
   * @description گرفتن collection های مونگو
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async getCollections() {
    try {
      let result = (await BaseConfig.mongoDBO.collections()).sort(function (a, b) {
        var x = a['collectionName'];
        var y = b['collectionName'];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      }).map(x => {
        return x.collectionName;
      });
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error,'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   * @description find کردن در مونگو
   * @param colName نام کالکشن در مونگو
   * @param query کوئری مونگو
   * @param projection  projection در مونگو
   * @param limit
   * @param sort
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async find({colName, query , projection, limit , sort}) {
    try {
      let result;
      result = limit ? (projection ?
        (await BaseConfig.mongoDBO.collection(colName).find(query).project(projection).sort(sort).limit(limit).toArray()) :
        (await BaseConfig.mongoDBO.collection(colName).find(query).sort(sort).limit(limit).toArray())) :
        projection ?
          (await BaseConfig.mongoDBO.collection(colName).find(query).project(projection).sort(sort).toArray()) :
          (await BaseConfig.mongoDBO.collection(colName).find(query).sort(sort).toArray());
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error,'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   * @description گرفتن count از کوئری مونگو
   * @param colName نام کالکشن در مونگو
   * @param query کوئری مونگو
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async count({colName, query}) {
    try {
      let result = await BaseConfig.mongoDBO.collection(colName).count(query);
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error,'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   *
   * @description آپدیت در مونگو
   * @param colName نام کالکشن در مونگو
   * @param query کوئری مونگو
   * @param set آبجکتی که قرار است جایگذاری شود
   * @param {Boolean}upsert
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async updateOne({colName, query , set,unset, upsert} ) {
    try {
      let result;
      if (upsert) result = await BaseConfig.mongoDBO.collection(colName).updateOne(query, {$set: set,$unset: unset}, upsert);
      else result = await BaseConfig.mongoDBO.collection(colName).updateOne(query, {$set: set, $unset: unset});
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error,'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   *
   * @description آپدیت چندتایی در مونگو
   * @param colName نام کالکشن در مونگو
   * @param query کوئری مونگو
   * @param set آبجکتی که قرار است جایگذاری شود
   * @param {Boolean}upsert
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async updateMany({colName, query , set,unset, upsert }) {
    try {
      let result;
      if (upsert) result = await BaseConfig.mongoDBO.collection(colName).updateMany(query, {$set: set}, upsert);
      else result = await BaseConfig.mongoDBO.collection(colName).updateMany(query, {$set: set , $unset: unset});
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error,'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   * @description حذف از مونگو
   * @param {!string}colName نام کالکشن در مونگو
   * @param {!object}query کوئری مونگو
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async deleteOne({colName, query}) {
    try {
      let result = await BaseConfig.mongoDBO.collection(colName).deleteOne(query);
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error, 'منطق تابع تست ', 'خطای عمومی');
    }
  }

  /**
   * @description حذف چندتایی از مونگو
   * @param {!string}colName نام کالکشن در مونگو
   * @param {!object}query کوئری مونگو
   * @memberOf CrudBl
   * @returns {Promise<BussinessLogicResult>}
   */
  async deleteMany({colName, query}) {
    try {
      let result = await BaseConfig.mongoDBO.collection(colName).deleteMany(query);
      return this.successResult('سرویس مربوطه با موفقیت فراخوانی شد', result);
    }
    catch (error) {
      BaseException.raiseError(error, 'منطق تابع تست ', 'خطای عمومی');
    }
  }
}


module.exports = CrudBl;
