let PartDataLayerInterface = require('partDataLayerInterface');
let mongodb = require('mongodb');
let BaseConfig = require('partdcFramework').BaseConfig;
let ExceptionRegulator = require('emsModule').ExceptionRegulator;
let redis = require('async-redis');
let q = require('q');
let async = require('async');
let env = require('./env');
let {BaseUtility, BaseException} = require('partServiceScaffoldModule');
let utility = require('./utility');
let PartLogger = require('partLogger');
let moment = require('moment-jalaali');
let u = require('partUtilities');
let requestPromise = require('request-promise');

/**
 * در این کلاس کلیه متغیرهای استاتیک و همچنین رفرنس به اینترفیس ها قرار می گیرد
 *
 * @description
 *
 *  برای یکسان بودن متغیرهای کانفیگ فریم ورک و پروژه فعلی حتما از متد ذیل استفاده شود
 *
 * setInfo
 *
 *  در صورتی که این تنظیمات منحصر به پروژه فعلی است می توان ان را به صورت متغیرهای استاتیک مقداردهی کرد
 *
 * @class Config
 */
class Initializer {

  /**
   *
   *  مقداردهی اولیه به کلیه اینترفیس ها و ابجکت های مورد نیاز
   *
   //1 rest
   //2 soap
   //3 crawl
   * @static
   * @memberof Config
   */
  static async Initialize(serviceCallMethodList = [1]) {
    Initializer.Init = false;

    BaseConfig.dcsName = 'divar';
    BaseConfig.redisLoggingEnabled = false;

    BaseConfig.serviceCallMethod = serviceCallMethodList;
    let partMongoInterfaceConfig = {
      global: {},
      instance: {
        host: '127.0.0.1',
        port: 27017,
        dbName: env.PARTDCEXCHANGECODAL_MONGO_AUTH,
        dbUser: env.PARTDCEXCHANGECODAL_MONGO_USERNAME,
        dbPass: env.PARTDCEXCHANGECODAL_MONGO_PASSWORD,
        strictMode: false
      }
    };
    let partLoggerConfig = {
      global: {
        partMongoInterfaceConfig
      },
      instance: {
        sourceTypeWidth: 8,
        sourceNameWidth: 20,
        winstonConfig: {
          handleExceptions: true,
          json: true,
          colorize: true,
          timestamp: function () {
            return (new Date()).toLocaleTimeString();
          },
          prettyPrint: true
        },
        storageConfig: {
          dls: {
            enabled: false,
            storageName: 'Logger@6-test'
          },
          mongo: {
            enabled: false,
            storageName: 'Logger@6-test'
          },
          fileSystem: {
            enabled: false,
            storageName: 'logfile'
          },
          http: {
            enabled: false,
            host: '127.0.0.1',
            port: '80',
            path: '/service/logServer/saveLog',
            method: 'POST'
          }
        },
        levelConfig: {
          event: {
            view: true,
            save: false,
            color: 'greenBg',
            viewPath: false,
            priority: 2
          },
          warning: {
            view: true,
            save: true,
            color: 'yellowBg',
            viewPath: true,
            priority: 1
          },
          error: {
            view: true,
            save: true,
            color: 'redBg',
            viewPath: true,
            priority: 0
          },
          info: {
            view: true,
            save: false,
            color: 'blueBg',
            viewPath: true,
            priority: 3
          },
          saves: {
            view: false,
            save: false,
            color: 'cyanBg',
            viewPath: true,
            priority: 4
          },
          mosifa: {
            view: true,
            save: true,
            color: 'cyanBg',
            viewPath: true,
            priority: 5
          },
          part: {
            view: true,
            save: true,
            color: 'cyanBg',
            viewPath: true,
            priority: 6
          }
        }
      }
    };
    let Logger = new PartLogger(partLoggerConfig.global);
    BaseConfig.partLogger = new Logger(partLoggerConfig.instance);
    await Initializer.initConfigs();
    await Initializer.initInterfaces();
    // await Initializer.initStaticServiceInfo();
    // await Initializer.initLocalVariables();

    let moduleInfo = await BaseUtility.getPackageJson(__dirname);
    BaseConfig.er = ExceptionRegulator.useDefaultConfig(
      moduleInfo
    );
    Initializer.er = ExceptionRegulator.useDefaultConfig(
      moduleInfo
    );
    BaseException.mongoDBO = BaseConfig.mongoDBO;
    Initializer.Init = true;

  }

  /**
   * مقداردهی فایل های کانفیگ فریم ورک بر اساس لیست ورودی
   *
   * @static
   * @memberof Config
   */
  static async initConfigs() {
    if (BaseConfig.serviceCallMethod.includes(1))
      await Initializer.initRestConfig();
  }

  /**
   *
   * مقداردهی کلی اینترفیس ها
   * @static
   * @memberof Config
   */
  static async initInterfaces() {
    await Initializer.initMongoRedis();

    let partDataLayerInterfaceConfig = {
      global: {
        protocol: 'http',
        host: env.PARTDCEXCHANGECODAL_DLS_HOST,
        path: env.PARTDCEXCHANGECODAL_DLS_PATH,
        port: 80,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      instance: {}
    };

    let PartDataLayerIns = new PartDataLayerInterface(
      partDataLayerInterfaceConfig.global
    );
    BaseConfig.partDataLayerInterface = new PartDataLayerIns(
      partDataLayerInterfaceConfig.instance
    );
  }

  /**
   *
   * مقداردهی نام دیتابیس مانگو و کانکشن مربوطه
   * @static
   * @memberof Initializer
   */
  static async initMongoRedis() {
    let mongoPassword = env.PARTDCEXCHANGECODAL_MONGO_PASSWORD;
    let mongoUsername = env.PARTDCEXCHANGECODAL_MONGO_USERNAME;
    let mongoAuthDb = env.PARTDCEXCHANGECODAL_MONGO_AUTH;

    BaseConfig.redisClient = redis.createClient({
      host: env.PARTDCEXCHANGECODAL_REDIS_SERVER,
      db: env.PARTDCEXCHANGECODAL_REDIS_INDEX,
      password: env.PARTDCEXCHANGECODAL_REDIS_PASSWORD
    });

    Initializer.mongoConfig = BaseConfig.mongoConfig = {
      server: env.PARTDCEXCHANGECODAL_MONGO_SERVER,
      port: env.PARTDCEXCHANGECODAL_MONGO_PORT
    };
    // var options = {connectTimeoutMS : 300000}
    var options = {
      useNewUrlParser: true,
      // retry to connect for 6000 times
      reconnectTries: 6000,
      // wait 1 second before retrying
      reconnectInterval: 1000
    }
    // BaseConfig.dcsDatabaseName = 'partdcec';
    BaseConfig.dcsDatabaseName = env.PARTDCEXCHANGECODAL_MONGO_DATABASENAME;
    var url = 'mongodb://' +  (mongoUsername && mongoPassword ? `${mongoUsername}:${mongoPassword}@` : '') +
      BaseConfig.mongoConfig.server + ':' + BaseConfig.mongoConfig.port +
      '/' + (mongoUsername && mongoPassword ? `${mongoAuthDb}` : '')
    BaseConfig.mongoDBConnection = await mongodb.MongoClient.connect(url,options);


    // { useNewUrlParser: true }
    BaseConfig.mongoDBO = BaseConfig.mongoDBConnection.db(
      BaseConfig.dcsDatabaseName
    );
  }

  /**
   *
   * فراخوان یتابع serviceIfo
   * @static
   * @memberof Initializer
   */
  static async initStaticServiceInfo() {
    let defer = q.defer();
    try {
      await Initializer.initMongoRedis();
      let statementsReqInfo = [
        'statements',
        'codalStatementsLetterType',
        'getStatementsInfo',
        'crawlStatementsSearchItems',
        'codalStatementsPublishers',
        'getStockList',
        'getFundList'
      ];
      await async.each(
        statementsReqInfo,
        async function (serviceName) {
          try {
            await BaseConfig.mongoDBO.collection('services').updateOne(
              {
                serviceName: serviceName
              },
              {
                $set: {
                    hasContent: true,
                    hasJobScheduler: false,
                    realTime: false,
                    serviceCallMethod: null,
                    serviceEnable: true,
                    serviceName: serviceName,
                }
              },
              {
                upsert: true
              }
            );
          }
          catch (e) {
            utility.consoleLog('MongoError  :   ', e);
          }
        },
        async () => {
          // utility.consoleLog('all Static Services information stored in database');
          defer.resolve();
        }
      );
    }
    catch (error) {
      utility.consoleLog(error);
    }
    return defer.promise;
  }

  /**
   *
   * مقداردهی اولیه برای فرلخوان یسرویس های rest
   * @static
   * @memberof Initializer
   */
  static async initRestConfig() {
    BaseConfig.createRestConfig();
    BaseConfig.restConfig.address = 'https://api.rbcapi.ir/codal/';
    BaseConfig.restConfig.tokenRequired = false;
    BaseConfig.restConfig.tokenInfo = {
      token: null,
      method: 'POST',
      url: 'https://api.rbcapi.ir/login/',
      header: {
        'Content-Type': 'application/json',
        userKey: '995a101009eac420a271f403b59d964974a9acb4'
      },
      body: {
        Username: 'partfip.user',
        Password: 'partfip@user123',
        ProjectCode: '1002'
      }
    };
    BaseConfig.restConfig.header = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: ''
    };
  }

  /**
   *
   * @returns {Promise<void>}
   */
  static async initSoapConfig() {
    BaseConfig.createSoapConfig();
    BaseConfig.soapConfig.address =
      'http://service.tsetmc.com/webservice/TsePublicV2.asmx?WSDL';
    BaseConfig.soapConfig.parameters = {
      UserName: 'partprocessing',
      Password: 'partprocessing'
    };

    let initDone = false;
    while (!initDone) {
      try {
        await BaseConfig.soapConfig.init();
        initDone = true;
      }
      catch (error) {
        utility.consoleLog('  ========= Init Soap Config Failed ============= ');
        utility.consoleLog('Repeat Init soap Config .... ');
        utility.consoleLog('  ========= Init Soap Config Failed ============= ', '\n');
        await BaseUtility.snooze(1000);
      }
    }
  }

  static async initLocalVariables() {
    await this.getTokenRayanBourse();
    await this.initStatements();
    await this.initSymbolList();
    await this.initStatementTypes();
  }

  static async initStatements() {
    let currentDate = moment(new Date()).format('jYYYYjMMjDD');
    BaseConfig.statements = [];
    let LVFiled = {
      _id: 0,
      tracingNo: 1,
      symbol: 1,
      type: 1,
      hasInfo: 1,
      contentNeed: 1
    };
    let statementsCurrentDate = await BaseConfig.mongoDBO.collection('CodalStatements').find({
      'date': currentDate,
      'contentNeed' : false
    }, {fields: LVFiled}).toArray();
    let statementsContentNeed = await BaseConfig.mongoDBO.collection('CodalStatements').find({
      'contentNeed': true,
      'hasInfo': false
    }, {fields: LVFiled}).toArray();
    let symbolUpdateNeed = await BaseConfig.mongoDBO.collection('symbolList').find({updateNeed : { '$nin' : [null] }}, {fields: {'_id': 0}}).toArray();

    utility.consoleLog(' statements currentDate : ',statementsCurrentDate.length);
    utility.consoleLog(' statements contentNeed true : ',statementsContentNeed.length);
    utility.consoleLog(' statements calculateNeed : ',symbolUpdateNeed.length);

    statementsCurrentDate.forEach((item) => {
      BaseConfig.statements.push(item);
    });
    statementsContentNeed.forEach((item) => {
      BaseConfig.statements.push(item);
    });
  }

  static async initSymbolList() {
    BaseConfig.symbolList = await BaseConfig.mongoDBO.collection('symbolList').find({}, {fields: {'_id': 0}}).toArray();
    BaseConfig.publisher = await BaseConfig.mongoDBO.collection('publishers').find({}).toArray();
  }

  static async initStatementTypes() {
    let defer = q.defer();
    BaseConfig.stmTypes = await BaseConfig.mongoDBO.collection('types').find({}, {fields: {'_id': 0}}).toArray();
    if (!BaseConfig.stmTypes.length) {
      BaseConfig.stmTypes = [
        {
          name: 'IFS_NotAudited_Orig',
          symbol: {
            stockTypeName: 'stock'
          },
          query: {
            letterType: 6,
            isAudited: false,
            letterKind: 0
          },
          id: 1,
          calculating: [
            'PToB',
            'PToS',
            'EPS',
            'ROA',
            'ROE',
            'CurrentRatio',
            'QuickRatio',
            'CashRatio',
            'DebtRatio'
          ],
          checkFields: [
            {
              title: /\(\s*?\n*?\s*?شرکت/,
              match: null
            },
            {
              dateGte: '13980101'
            }
          ]
        },
        {
          name : 'IFS_Audited_Orig',
          symbol : {
            stockTypeName : 'stock',
          },
          query : {
            letterType : 6,
            isAudited : true,
            letterKind : 0
          },
          id : 2,
          checkFields: [
            {
              title: /\(\s*?\n*?\s*?شرکت/,
              match: null
            },
            {
              dateGte: '13980101'
            }
            // {
            //   symbolList : [
            //     'ونوین',
            //     'وگردش',
            //     'وکار',
            //     'وشهر',
            //     'وسینا',
            //     'وسالت',
            //     'وزمین',
            //     'ورفاه',
            //     'وخاور',
            //     'وتجارت',
            //     'وپست',
            //     'وپاسار',
            //     'وپارس',
            //     'وبملت',
            //     'وبصادر',
            //     'وآیند',
            //     'سمایه',
            //     'سامان',
            //     'دی',
            //     'وملل'
            //   ],
            // }
          ]
        },
        {
          'name' : 'MAR_banks',
          'id': 3,
          checkFields: [
            {
              'title': /\(\s*?\n*?\s*?شرکت/,
              'match': null
            },
            {
              'dateGte': '13950101'
            },
            {
              'symbolList': [
                'ونوین',
                'وگردش',
                'وکار',
                'وشهر',
                'وسینا',
                'وسالت',
                'وزمین',
                'ورفاه',
                'وخاور',
                'وتجارت',
                'وپست',
                'وپاسار',
                'وپارس',
                'وبملت',
                'وبصادر',
                'وآیند',
                'سمایه',
                'سامان',
                'دی',
                'وملل'
              ]
            }
          ],
          'query': {
            'letterType': 58,
            'letterKind': 0
          },
          'symbol': {
            'stockTypeName': 'stock'
          }
        }
      ];
      async.each(BaseConfig.stmTypes, async item => {
        await BaseConfig.mongoDBO.collection('types').updateOne(
          {
            id: item.id
          },
          {
            $set: item
          },
          {
            upsert: true,
            // serializeFunctions: true
          }
        );
      },
      (e) => {
        if (!e){
          defer.resolve();
          this.createTypeQueries();
          console.log('all Static statements types add successfully');
        }
        defer.reject(e);
      }
      );
    }
    else {
      this.createTypeQueries();
      console.log('all Static statements types add successfully');
    }
    return defer.promise;
  }

  static async getTokenRayanBourse(){
    let options = {
      method: 'POST',
      url: 'https://api.rbcapi.ir/login/',
      headers: {
        'Content-Type': 'application/json',
        userKey: '995a101009eac420a271f403b59d964974a9acb4'
      },
      rejectUnauthorized: false,
      body: {
        Username: 'partfip.user',
        Password: 'partfip@user123',
        ProjectCode: '1002'
      },
      json: true,
      resolveWithFullResponse: true
    }
    try {
      let token = await BaseConfig.redisClient.get('Token');
      let lastTokenDate = await BaseConfig.redisClient.get('LastTokenDate');
      let newDate = new Date().getTime();
      let oneDay = 86400000;
      if (token &&(newDate - lastTokenDate < oneDay))
        BaseConfig.token = token;
      else{
        const result = await requestPromise(options)
        if (result) {
          let currentDateTime = moment(new Date()).format('jYYYYjMMjDD HH:mm:ss');
          await BaseConfig.mongoDBO.collection('tokenRequests').insertOne({
            lastDateTime : currentDateTime,
            statusCode : result.statusCode,
            request : options,
            response : result.body
          });
          await BaseConfig.redisClient.set('Token', result.body);
          await BaseConfig.redisClient.set('LastTokenDate', new Date().getTime());
          await BaseConfig.redisClient.del('Error403');
          BaseConfig.token = result.body;
        }
      }
    } catch (error) {
      let currentDateTime = moment(new Date()).format('jYYYYjMMjDD HH:mm:ss');
      await BaseConfig.mongoDBO.collection('tokenRequests').insertOne({
        lastDateTime : currentDateTime,
        statusCode : error.statusCode,
        request : error.options,
        response : error.message
      });
      utility.consoleLog(error, "ارسال درخواست", "ایجادتوکن");
    }
  }

  static createTypeQueries() {
    BaseConfig.typeQueries = {};
    let today = moment(new Date()).format('jYYYYjMMjDD');
    let copy  = u.cloneObject(BaseConfig.stmTypes);
    for(let item of copy) {
      BaseConfig.typeQueries[item.name] = {};
      let startDate = null;
      let endDate = today;
      let stmConditions = item.query;
      let symbolConditions = item.symbol;
      let calculating = item.calculating;
      symbolConditions.symbol = {
        '$nin' : ['NotFound']
      };
      let titleCheck = item.checkFields[0];
      let dateCheck = item.checkFields[1];
      let symbolFilter = item.checkFields[2];
      stmConditions.date = {
        '$lte': endDate
      };
      if (titleCheck) {
        stmConditions.title = {};
        if (!titleCheck.match) {
          stmConditions.title = {
            '$not': {'$regex': titleCheck.title}
          };
        }
        else {
          stmConditions.title = {'$regex': titleCheck.title};
        }
      }
      if (dateCheck && dateCheck.dateGte) {
        stmConditions.date['$gte'] = startDate ? startDate : dateCheck.dateGte;
      }
      if (symbolFilter){
        symbolConditions.symbol = {
          '$in' : symbolFilter.symbolList
        };
      }
      BaseConfig.typeQueries[item.name] = {
        stmConditions : stmConditions,
        symbolConditions : symbolConditions,
        calculating : calculating
      };
    }
  }
}

module.exports = Initializer;
