require('../initDotEnv');
let Initializer = require('../initializer');
let ServiceRegister = require('../serviceRegistration/serviceRegister');

// let InterimStatementsBl = require('../bussinessLogic/operatingIncome.js');
// let SearchItemsBl = require('../bussinessLogic/SearchItemsBl');
let StatementBl = require('../bussinessLogic/StatementsBl');

class TestRest {

  async testExampleService() {
    // رجیستر کردن کلیه کلاس ها
    let sr = new ServiceRegister();
    sr.init();

    // تعیین پارامتر ورودی
    // let requestData = {
    //   serviceName: 'stockList',
    //   // body: {
    //   //   serviceName: "archiveStatementsCodal360"
    //   // }
    // };

    // فراخوانی بیزینس لاجیکی که از بیرون توسط زمانبند یا پنل ادمین فراخوانی می شود


    try {
      //for first time - comment it after first rum
      // await dcsConfig.Initialize()
      // await dcsConfig.soapConfig.saveSoapServices();

      //for normal run

      await Initializer.Initialize([1]);
      await new StatementBl().statements({startDate:'13990806'});
    }
    catch (error) {
    }

  }


}

new TestRest().testExampleService().then(() => {
});