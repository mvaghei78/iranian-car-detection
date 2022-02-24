
/**
 *@namespace ServiceInfo
 */
let utility = require('../utility');
require('../index');
let {
  BaseServiceModel,
  BaseConfig
} = require('partdcFramework');
let initializer = require('../initializer');
let serviceRegister = require('../serviceRegistration/serviceRegister');
/**
 * @class ServiceInfo
 */
class ServiceInfo {
  /**
   *Creates an instance of ExampleService.
   * @memberof  ServiceInfo
   */
  constructor() {}

  /**
   * درج اطلاعات سرویس موردنظر در مانگو
   *
   * @memberof ServiceInfo
   */
  async saveServiceInfo() {
    await initializer.initMongoRedis();
    utility.consoleLog('============================');
    utility.consoleLog('Mongo Connection Info');
    utility.consoleLog(BaseConfig.mongoConfig);
    utility.consoleLog('============================');

    let sr = new serviceRegister();
    sr.init();
    let newServices = [];
    let oldServices = [];

    // eslint-disable-next-line no-unused-vars
    for (const [key, serviceClass] of sr.serviceContainer.container) {
      utility.consoleLog(key);
      let serviceModel = new BaseServiceModel();
      serviceModel.serviceName = serviceClass().serviceName;
      serviceModel.serviceEnable = true;

      let exists = await BaseConfig.mongoDBO
        .collection('services')
        .findOne({ serviceName: serviceModel.serviceName });

      if (exists==null) {
        await BaseConfig.mongoDBO
          .collection('services')
          .updateOne(
            { serviceName: serviceModel.serviceName },
            { $set: serviceModel }, {upsert:true}
          );
        newServices.push(serviceModel.serviceName);
      }
      else oldServices.push(serviceModel.serviceName);
    }

    utility.consoleLog('');
    utility.consoleLog('======= New services  =======');
    newServices.forEach(item => {
      utility.consoleLog(item);
    });
    utility.consoleLog('-----------------------------');
    utility.consoleLog('');
    utility.consoleLog('======= Old services  =======');
    oldServices.forEach(item => {
      utility.consoleLog(item);
    });
    utility.consoleLog('-----------------------------');
  }
}

new ServiceInfo().saveServiceInfo().then( () => {
  process.exit(0);
});
