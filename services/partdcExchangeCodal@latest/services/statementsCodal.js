let utility = require('../utility');
/**
 *@namespace StatementsCodal
 */


let {
  BaseConfig,
  BaseServiceClass
} = require('partdcFramework');
let async = require('async');
let q = require('q');
let us = require('underscore');

/**
 * @class StatementsCodal
 * @extends {BaseServiceClass}
 */
class StatementsCodal extends BaseServiceClass {


  /**
   *Creates an instance of ExampleService.
   * @param {!string} serviceName نام سرويس
   * @param {!string} serviceRedisKey نام منحصر به فرد سرويس جهت ذخيره سازي در رديس و عدم تکراري بودن فرايند اجراي ان
   * @param {object} inputParam پارامترهاي دريافتي از کاربر
   * @param serviceCallMethod
   * @memberof  StatementsCodal
   */
  constructor(serviceName, serviceRedisKey, inputParam, serviceCallMethod) {
    super(serviceName, serviceRedisKey, inputParam, serviceCallMethod);
   }

  /**
   *@description بازنويسي تنظيمات مرتبط با رست
   * @returns {!object} تنظیمات درخواست رست
   * @memberof  StatementsCodal
   */
  getRestRequestOptions() {
    let options = super.getRestRequestOptions();
    options.method = 'GET';
    options.rejectUnauthorized = false;
    options.resolveWithFullResponse = true;
    options.url = this.inputParam.url;
    // options.url = "https://api.divar.ir/v8/web-search/tehran/car/audi?page=1";
    return options;
  }

  /**
   * @description جهت پردازش داده هاي دريافتي متد ذيل مي بايست پياده سازي شود
   * @memberof  StatementsCodal
   * @returns {void}
   */
  async processData() {
    let serviceData = [];
    let defer = q.defer();
    let data = this.serviceData;
    let type_links = data.internal_link_sections ? data.internal_link_sections[0].links : [];
    let count = 0;
    for(let obj of type_links){
      count += obj.post_count;
    }
    if (!count)
      this.logSystem.logClass.totalCount  = data.widget_list.length;
    else
      this.logSystem.logClass.totalCount = count;
    if (data.seo_details.next){
      this.logSystem.logClass.next_page = true;
    }else if (data.seo_details.prev){
      this.logSystem.logClass.next_page = false;
    }
    async.each(data.widget_list,async(item) => {
      let image = item.data.web_image.length ? item.data.web_image[1].src.split('.jpg')[0] : null;
      let imageList = {
        'image1': image + '.jpg',
        'image2': image + '.1.jpg',
        'image3': image + '.2.jpg',
        'image4': image + '.3.jpg',
        'image5': image + '.4.jpg',
      }
      let obj = {
        "title": item.data.title,
        "image": item.data.web_image.length ? item.data.web_image[1].src : null,
        "token": item.data.token,
        "index": item.data.index,
        "city":  item.data.city,
        "imageList" : imageList,
        "place" : this.inputParam.place,
        "brand_code" : this.inputParam.brand_code,
        "brand_name" : this.inputParam.brand_name
      };
      serviceData.push(obj);
    },(error) => {
      if (error)
        defer.reject(error);
      else{
        this.serviceData = serviceData;
        defer.resolve(true)
      }
    })
    return defer.promise;
  }

  /**
   *
   * بازنويسي فرايند ذخيره سازي داده
   * this.logSystem.logClass.dlsTags = tags;
   * @memberof  StatementsCodal
   * @returns {void}
   */
  async saveData() {
    let data = this.serviceData;
    if (data) {
      let defer = q.defer();
      try {
        async.eachSeries(data, async (item) => {
          await BaseConfig.mongoDBO.collection('cars').updateOne(
            { token: item.token},
            { $set : item},
            {upsert: true});
        }, (error) => {
          if (error) {
            utility.consoleLog('===============================');
            utility.consoleLog('Error in innerSeries', error);
            utility.consoleLog('===============================');
          }
          else
            defer.resolve();
        });
        // let place = {};
        // place[this.inputParam.place] = this.logSystem.logClass.totalCount;
        // await BaseConfig.mongoDBO.collection('brands').updateOne(
        //   { id: this.inputParam.brand_code},
        //   { $set: place
        //   });
      }
      catch (e) {
        utility.consoleLog(e);
        defer.reject(e);
      }
      return defer.promise;
    }
  }
}

module.exports = StatementsCodal;