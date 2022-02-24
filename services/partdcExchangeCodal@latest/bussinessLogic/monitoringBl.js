/**
 * @namespace monitoringBl
 */
let {
  BaseConfig
} = require('partdcFramework');
let BaseBussinessLogic = require('partServiceScaffoldModule').BaseBussinessLogic;
let utility = require('../utility');
/**
 * @class MonitoringBl
 * @summary کلاس لایه بیزینس مانیتورینگ
 * @memberOf monitoringBl
 * @description
 *
 @extends BaseBussinessLogic
 */
class MonitoringBl extends BaseBussinessLogic {

  /**
   * @memberOf monitoringBl.MonitoringBl
   * @description
   * مانیتور کردن وضعیت ماشین
   * @return {Promise<*>}
   */
  async machineMonitoring() {
    try {
      let result;
      // در آینده می تواند بررسی وضعیت ماشین باشد ولی در حال حاضر فقط بالا بودن مد نظر است
      ///
      result = 1;
      return result;
    }
    catch (e) {
      utility.consoleLog(e, 'MonitoringBlMethod', 'monitoringBl');
    }

  }

  /**
   * @memberOf monitoringBl.MonitoringBl
   * @description
   * مانیتور کردن وضعیت سرویس های ماشین
   * @return {Promise<*>}
   */
  async servicesMonitoring() {
    try {
      let result  = [];
      let obj = {};
      obj.serviceName = 'statements';
      let dateTime = new Date();
      let endDate = dateTime.setMinutes(dateTime.getMinutes() - 10);
      endDate = new Date(endDate);
      utility.consoleLog(endDate);
      var weekday = new Array(7);
      weekday[0] = 'Sunday';
      weekday[1] = 'Monday';
      weekday[2] = 'Tuesday';
      weekday[3] = 'Wednesday';
      weekday[4] = 'Thursday';
      weekday[5] = 'Friday';
      weekday[6] = 'Saturday';
      var date = weekday[endDate.getDay()];
      if (date === 'Friday'){
        obj.serviceStatus = 1;
      }
      else {
        if (endDate.getHours() >= 0 && endDate.getHours() <= 8 ){
          obj.serviceStatus = 1;
        }
        else {
          let servicelogs = await BaseConfig.mongoDBO.collection('serviceLogs').find({
            serviceEnd : {$gt:endDate}
          }).toArray();
          if (servicelogs.length) {
            obj.serviceStatus = 1;
          }
          else {
            obj.serviceStatus = 0;
          }
        }
      }
      result.push(obj);
      return result;
    }
    catch (e) {
      utility.consoleLog(e, 'servicesMonitoringMethod', 'monitoringBl');
    }

  }

}

module.exports = MonitoringBl;