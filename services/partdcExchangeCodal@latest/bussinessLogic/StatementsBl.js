let utility = require('../utility');
/**
 * @namespace statmentsBL
 */
let {BaseException} = require('partServiceScaffoldModule');
let {
  BaseConfig,
  DCManager,
} = require('partdcFramework');
let {
  BaseBussinessLogic
} = require('partServiceScaffoldModule');
let q = require('q');
let async = require('async/dist/async');
let moment = require('moment-jalaali');
let initializer = require('./../initializer');
let ServiceRegister = require('../serviceRegistration/serviceRegister');
let StatementsInfo = require('./statementsInfoBl');
let u = require('partUtilities');
let request = require('request');
let fs = require('fs');
let rp = require('request-promise');
const https = require('https');


/**
 * @class StatementsBl
 * @extends {BaseBussinessLogic}
 */
class StatementsBl extends BaseBussinessLogic {
  /**
   *
   * @description دریافت اطلاعیه های کدال در بازه درخواستی
   * این سرویس با فراخوانی api های خریداری شده از شرکت رایان بورس در بازه زمانی تعیین شده اطلاعیه های منتشر شده در کدال را دریافت و در پایگاه داده ذخیره سازی میکند.
   * @memberof StatementsBl
   * @returns {void}
   */

  async getCarsInfo(location) {
    try {
      let serviceRegister = new ServiceRegister();
      let currentDate = moment(new Date()).format('jYYYY/jMM/jDD');
      let serviceModel = {};
      let serviceClass;
      // let ids = [416,206,406,436,346,351,366,1181,693,658,486,885,937,835,570,825,1219]
      let query = {};
      query[location] = null;
      query.country = 'iran';
      let brand_items = await BaseConfig.mongoDBO.collection('brands').find(query).toArray();
      async.eachSeries(brand_items, async (brand_item) => {
        let brand_name = brand_item.code.toLowerCase();
        let sections = brand_name.split(' ');
        let query = brand_item.query ? brand_item.query : '';
        if (!brand_item.query) {
          for (let section of sections) {
            query = query + '/' + section;
          }
        }

        //tehran-province
        //khorasan-razavi-province
        //isfahan-province
        //azarbaijan-east-province
        //alborz-province
        //fars-province
        //azerbaijan-west-province
        //   let url = 'https://api.divar.ir/v8/web-search/'+location+'/car' + query + '?page=1&brand_model=' + brand_item.code;
        await BaseConfig.mongoDBO.collection('brands').updateOne({
          'code': brand_item.code
        }, {
          '$set': {
            'query': query
          }
        });
        // serviceModel.brand_code = brand_item.id;
        // serviceModel.brand_name = brand_item.name;
        // serviceModel.place = location;
        // serviceModel.url = url;
        // utility.consoleLog('=============================');
        // utility.consoleLog(`brand_name ${brand_item.name}   start`);
        // serviceModel.serviceName = 'statement';
        // serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
        // let DC = await new DCManager(serviceModel, serviceClass).run();
        // console.log(DC.next_page);
      });
    } catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }

  async checkStatementsCounts(limitCount) {
    let dates = await BaseConfig.mongoDBO.collection('statementsCount').find({
      $where: 'this.countDB < this.codalCount'
    }).sort({'date': -1}).limit(limitCount).toArray();
    async.eachSeries(dates, async (item) => {
      try {
        console.log(item.date);
        await this.statementsArchive(item.date);
      } catch (e) {
        utility.consoleLog(e);
      }
    }, (e) => {
      if (e) {
        BaseException.raiseError(e, 'فرآیند داده گیری ');
      }
    });
  }

  async statementsArchive(date) {
    try {
      let defer = q.defer();
      let brand_items = await BaseConfig.mongoDBO.collection('brands').find({
        'country': 'iran',
        'totalCount': {
          '$gte': 300
        },
        status: null
      }).toArray();
      async.eachSeries(brand_items, async (brand_item) => {
        await this.findLocationsByBrand(brand_item);
        await BaseConfig.mongoDBO.collection('brands').updateOne(
          {name: brand_item.name},
          {
            $set: {
              status: true
            }
          });
      }, (e) => {
        if (e) {
          defer.reject(e);
        }
        else {
          defer.resolve(true);
        }
      });
      return defer.promise;
    } catch (error) {
      BaseException.raiseError(error, 'فرآیند داده گیری ');
    }
  }


  async findLocationsByBrand(brand_item) {
    try {
      let defer = q.defer();
      brand_item.code = brand_item.code.toLowerCase();
      let brand_item_locations = [
        {'name': 'tehran-province', 'count': brand_item['tehran-province']},
        {'name': 'khorasan-razavi-province', 'count': brand_item['khorasan-razavi-province']},
        {'name': 'isfahan-province', 'count': brand_item['isfahan-province']},
        {'name': 'azarbaijan-east-province', 'count': brand_item['azarbaijan-east-province']},
        {'name': 'alborz-province', 'count': brand_item['alborz-province']},
        {'name': 'fars-province', 'count': brand_item['fars-province']},
        {'name': 'azerbaijan-west-province', 'count': brand_item['azerbaijan-west-province']},
        {'name': 'khuzestan-province', 'count': brand_item['khuzestan-province']},
        {'name': 'mazandaran-province', 'count': brand_item['mazandaran-province']},
        {'name': 'kerman-province', 'count': brand_item['kerman-province']},
        {'name': 'sistan-and-baluchestan-province', 'count': brand_item['sistan-and-baluchestan-province']},
        {'name': 'gilan-province', 'count': brand_item['gilan-province']},
        {'name': 'khorasan-south-province', 'count': brand_item['khorasan-south-province']},
        {'name': 'hormozgan-province', 'count': brand_item['hormozgan-province']},
        {'name': 'bushehr-province', 'count': brand_item['bushehr-province']},
      ];
      async.eachSeries(brand_item_locations, async (location) => {
        if (location.count >= 1000) {
          location.count = 1000;
        }
        let pageSize = +((location.count / 24).toFixed(0)) + 1;
        await this.callServiceByLocationAndPage(brand_item, location.name, pageSize);
      }, (e) => {
        if (e) {
          defer.reject(e);
        }
        else {
          defer.resolve(true);
        }
      });
      return defer.promise;
    } catch (e) {
      console.log(e);
    }
  }

  async callServiceByLocationAndPage(brand_item, location, pageSize) {
    try {
      let page = 1;
      brand_item.location = location;
      while (page < pageSize) {
        await this.callService(brand_item, page);
        page++;
      }
    } catch (e) {
      console.log(e);
    }
  }

  async callService(brand_item, page) {
    try {
      let serviceRegister = new ServiceRegister();
      let serviceModel = {};
      let serviceClass;
      let url = 'https://api.divar.ir/v8/web-search/' + brand_item.location + '/car' + brand_item.query + '?page=' + page;
      serviceModel.brand_code = brand_item.id;
      serviceModel.brand_name = brand_item.name;
      serviceModel.place = brand_item.location;
      serviceModel.url = url;
      utility.consoleLog('=============================');
      utility.consoleLog(`brand_name ${brand_item.name}   start`);
      serviceModel.serviceName = 'statement';
      serviceClass = serviceRegister.getServiceClass.bind(serviceRegister)(serviceModel);
      let DC = await new DCManager(serviceModel, serviceClass).run();
    } catch (e) {
      console.log(e);
    }
  }

  async handleError(DC) {
    if (!DC.saveDone) {
      if (DC.codalError) {
        let info = DC.codalError;
        let statusCode = info ? (info.StatusCode ? info.StatusCode : info) : 200;

        //به دلیل محدودیت در ارسال تعداد درخواست به سرور رایان بورس در صورتی که تعداد مجاز درخواست ها به پایان رسیده باشد سرویس باید تا پایان روز متوقف گردد بدین منظور در ردیس کلیدی را ست میکنیم که در پایان روز از بین خواهد رفت
        if (statusCode === 403) {
          var todayEnd = new Date().setHours(23, 59, 59, 999);
          BaseConfig.redisClient.set('Error403', new Date());
          BaseConfig.redisClient.expireat('Error403', parseInt(todayEnd / 1000));
          BaseException.raiseError('سرویس تا پایان روز جاری متوقف خواهد بود !!!', 'خطا در عملیات داده گیری');
        }
        else if (statusCode === 401 || statusCode === 404) {
          // در صورت نا معتبر بودن توکن تاکن حذف خواد شد و در اجرای بعدی سرویس فریم ورک داده گیری به خاطر وجود نداشتن توکن ابتدا سعی در دریافت توکن جدید میکند
          await initializer.getTokenRayanBourse();
          BaseException.raiseError('توگن نا معتبر است', 'خطا در عملیات داده گیری');
        }
      }
      else {
        BaseException.raiseError(DC.error, 'خطا در عملیات داده گیری');
      }
    }
  }

  async updateStatementsCountDB(date) {
    let d = date.replaceAll('/', '');
    let statementsCount = await BaseConfig.mongoDBO.collection('CodalStatements').count({date: d});
    await BaseConfig.mongoDBO.collection('statementsCount').updateOne(
      {date: date},
      {$set: {countDB: statementsCount}},
      {upsert: true});
  }


  //db.getCollection('cars').find({
  //     brand_code : 1294,
  //     image : {
  //         "$nin" : ["",null,/.webp/ ]
  //         }
  //
  //     })
  async downloadImages() {
    // get brand names
    // create folder by brand_code
    // request get car images
    // repaired image links
    // download image by token_1.jpg, token_2.jpg , ...
  }

  async getBrandNames(brand_code) {
    try {
      let counter = 271 ;
      let dir = 'F:\\projectFiles\\divar\\dcDivarInfo\\services\\partdcExchangeCodal@latest\\test\\' + brand_code;
      let defer = q.defer();
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      let cars = await BaseConfig.mongoDBO.collection('cars').find({
        brand_code: +brand_code,
        image: {
          '$nin': ['', null, /.webp/]
        }
      }).skip(58).toArray();
      async.eachSeries(cars, async (car) => {
        if (cars.length <= 500) {
          car.imageList = await this.requestCarImages(car.token);
        }
        for (let link in car.imageList) {
          let path = 'F:\\projectFiles\\divar\\dcDivarInfo\\services\\partdcExchangeCodal@latest\\test\\' + brand_code + '\\';
          link = car.imageList[link];
          link = link.replace('thumbnails', 'pictures');
          let fileName = link.match(/\/(\w|-|\.)*.jpg/)[0];
          fileName = fileName.substring(1);
          path = path + 'img_' + counter + '.jpg';
          console.log(link, path);
          try {
            await this.downloadFile(link, path);
          } catch (e) {
            console.log('---- error in get image ----', e);
          }
          counter = counter + 1;
        }
        await BaseConfig.mongoDBO.collection('cars').updateOne(
          {token: car.token},
          {
            $set: {
              status : true,
              imageList: car.imageList
            }
          });
      }, (e) => {
        if (e) {
          defer.reject(e);
        }
        else {
          defer.resolve(true);
        }
      });
      return defer.promise;
    } catch (e) {
      console.log('========== error =============', e);
    }
  }

  async downloadFile(originalImageLink, uploadedImagePath) {
    let defer = q.defer();
    try {
      let url = encodeURI(originalImageLink);
      let path = uploadedImagePath;
      // request(url)
      //   .pipe(fs.createWriteStream(path))
      //   .on('close', () => {
      //     defer.resolve(true);
      //   })
      //   .on('error', error => {
      //     console.log('---- error in get image ----');
      //     defer.reject(error);
      //   });
      request.emit('error', null);
      const filePath = fs.createWriteStream(path);
      await https.get(url,(res,err) => {
        if(err){
          defer.reject('err');
        }
        else{
          res.pipe(filePath);
          filePath.on('finish',async () => {
            filePath.close();
            defer.resolve(true);
            console.log('ok');
          })
        }
      })
        .on('error', function(e) {
        console.log("Got error: " + e.message);
      })
    } catch (e) {
      console.log('---- error in get image ----');
      defer.reject(false);
    }
    return defer.promise;
  }

  async requestCarImages(token) {
    try {
      let defer = q.defer();
      var options = {
        'method': 'GET',
        'url': 'https://api.divar.ir/v5/posts/' + token,
        'headers': {
          'Content-Type': 'application/json'
        }
      };
      let response = await rp(options);
      if (response) {
        // stockList = response.body;
        let obj = JSON.parse(response);
        utility.consoleLog(obj.widgets.images);
        defer.resolve(obj.widgets.images);
      }
      else {
        // save in bd
        await BaseConfig.mongoDBO.collection('cars').updateOne(
          {token: token},
          {
            $set: {
              status : false,
            }
          });
        console.log('---- error in get post image links ----');
        defer.reject([]);
      }
      return defer.promise;
    } catch (e) {
      // save in db
      await BaseConfig.mongoDBO.collection('cars').updateOne(
        {token: token},
        {
          $set: {
            status : false,
          }
        });
      console.log('---- error in get post image links ----');
      console.log(e);
    }
  }
}

module.exports = StatementsBl;
