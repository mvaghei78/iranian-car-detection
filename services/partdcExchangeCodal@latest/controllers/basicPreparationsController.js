/**
 * @namespace monitoringController
 */
const BaseController = require('partServiceScaffoldModule').BaseController;
let basicPreparationsBl = require('../bussinessLogic/basicPreparationsBl');

class BasicPreparationsController extends BaseController {

  async fillStatementsCount() {
    try {
      this.sendOk('سرویس fillStatementsCount با موفقیت اجرا شد');
      let startDate = this.body ? this.body.startDate ? this.body.startDate.replaceAll('/','') : null : null;
      await new basicPreparationsBl().getCountsStatementsDB(startDate);
      await new basicPreparationsBl().getStatementsCountCodal360();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }
  
  async separatingInfoFromStatements() {
    try {
      this.sendOk('سرویس separatingInfoFromStatements با موفقیت اجرا شد');
      await new basicPreparationsBl().separatingInfoFromStatements();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

  async extractDataFromStatements() {
    try {
      this.sendOk('سرویس separatingInfoFromStatements با موفقیت اجرا شد');
      await new basicPreparationsBl().extractDataFromStatements();
    }
    catch (error) {
      this.sendFail(error, 'متاسفانه اجرای سرویس با خطا مواجه شده است ');
    }
  }

}

module.exports = BasicPreparationsController;