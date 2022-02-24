require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let fs = require('fs');

let path = 'F:\\projectFiles\\codal\\archives\\140008-JSON';
let utility = require('../utility');
let async = require('async');
let q = require('q');
let moment = require('moment-jalaali');
let us = require('underscore');

// var iconv = require('iconv');

/**
 * این کلاس با هدف دریافت داده های ارشیوی اطلاعیه ها از فایل های دریافتی از رایان بورس نوشته شده است
 * @param path
 * @returns {Promise<[]>}
 */
class TestReadDir {

  constructor() {
  }

  async getFiles(path) {
    let defer = q.defer();
    await fs.readdir(new URL('file:///' + path), async (err, items) => {
      // utility.consoleLog(path  + '   items : ' + items.length);
      if (err) {
        utility.consoleLog(err);
      }
      // console(items);
      let obj = {};
      let content;
      async.eachSeries(items, async (element) => {
        try {
          const file = path + '/' + element;
          const stats = fs.lstatSync(file).isDirectory();
          if (stats) {
            await this.getFiles(file);
          }
          else {
            let jsonContent = fs.readFileSync(file, {encoding:'UTF-16LE'});
            // let jsonContent = await fs.readFileSync(file);
            // let jsonContent = await this.readFile(file, {encoding:'UTF-8'});
            if (file.match(/content/)) {
              // var ic = new iconv.Iconv('iso-8859-1', 'utf-8');
              // let body = ic.convert(body).toString('utf-8');
              // body = JSON.parse(body);
              let contentObj = jsonContent;
              // contentObj = jsonContent.substring(1,jsonContent.length);
              // content = jsonContent;
              // console(contentObj);
              try{
                content = JSON.parse(contentObj);
                // utility.consoleLog(' fetch data for tracingNo  -- file path : ' + element);
                // await this.saveToDB(content,element);
              }
              catch (e) {
                utility.consoleLog(element , e)
              }

            }
            else if (file.match(/header/)) {
              let str = jsonContent;
              // str = str.substring(1,str.length);
              try{
                obj = JSON.parse(str);
                // obj = str;
                // utility.consoleLog(' fetch data for tracingNo ' + ' header ');
              }
              catch (e) {
                utility.consoleLog(element , e)
              }
            }
            if (items.length === 1) {
              // if (obj.hasOwnProperty('Symbol')) {
              //   let result = this.createStandardObject(obj, content);
              //   console.log(result);
              //   // await this.saveToDB(result);
              // }
            }
            else {
              if (obj.hasOwnProperty('Symbol') && typeof content === 'object') {
                // obj['info'] = content;
                // utility.consoleLog('content')
               // utility.consoleLog(' fetch data for tracingNo ' + obj.TracingNo + ' -- file path : ' + element);
                let result = this.createStandardObject(obj, content);
                if (result.type){
                  console.log(result);
                  await this.saveToDB(result,content);
                }
              }
            }
          }
        }
        catch (err) {
          utility.consoleLog(err);
        }
      }, (error) => {
        if (error) {
          utility.consoleLog('===============================');
          utility.consoleLog('Error in innerSeries', error);
          utility.consoleLog('===============================');
        }
        else {
          // utility.consoleLog('--defer--');
          defer.resolve();
        }
      });
    });
    return defer.promise;
  }

  createStandardObject(obj) {
    let final = {};
    for (let item in obj) {
      let position_0_Lower = item.charAt(0).toLowerCase();
      let key = this.replaceAt(item, 0, position_0_Lower);
      final[key] = obj[item];
    }
    if (final.letterType === 6 && final.isAudited === true && final.letterKind === 0){
      if (this.symbolList[final.symbol]){
        if (final.title.match(/\(\s*?\n*?\s*?شرکت/) === null){
          final.type = 'IFS_Audited_Orig';
          final.hasInfo = true;
          final.finglishSymbol = utility.finglishIt(final.symbol);
          final.date = final.publishDateTime.substring(0,10).replaceAll('/','');
          final.contentNeed =  false;
        }
      }
    }
    return final;
  }

  replaceAt(string, index, replace) {
    return string.substring(0, index) + replace + string.substring(index + 1);
  }

  async saveToDB(data,content) {
    this.totoalCount ++;
    await BaseConfig.mongoDBO.collection('CodalStatements').updateOne(
      {tracingNo: data.tracingNo,
       hasInfo : false},
      {
        $set: data
      }).then(async (res) => {
      let lastUpdateDateTime = moment().format('jYYYY/jMM/jDD HH:mm:ss');
      let result = await BaseConfig.mongoDBO.collection('statementsInfo').updateOne(
        {tracingNo: data.tracingNo},
        {
          $setOnInsert : {
            info: content,
            lastUpdateDateTime : lastUpdateDateTime
          }
        },{upsert: true});
      if (res.upsertedCount){
        this.upsertedCount ++;
      }
      if (res.modifiedCount){
        this.modifiedCount ++;
      }
    });
  }

  async init() {
    this.modifiedCount = 0;
    this.upsertedCount = 0;
    this.totoalCount =0;
    await init.initMongoRedis();
    this.symbolList = await BaseConfig.mongoDBO.collection('symbolList').find({
      "stockTypeName" : "stock"
    }).toArray();
    this.symbolList = us.groupBy(this.symbolList,'symbol');
    await this.getFiles(path);
    utility.consoleLog(' totalCount statements : ' + this.totoalCount);
    utility.consoleLog(' modifiedCount statements : ' + this.modifiedCount);
    utility.consoleLog(' upsertedCount statements : ' + this.upsertedCount);
  }

  async readFile(path){
    let defer = q.defer();
    fs.readFile(path, 'utf8', (err, jsonString) => {
      if (err) {
        console.log("File read failed:", err);
        defer.reject(err);
      }
      else
        defer.resolve(jsonString);
    })
    return defer.promise;
  }

}

new TestReadDir().init(path).then(() => {
  utility.consoleLog();
});
