const fs = require('fs');
const https = require('https');
let utility = require('../utility');
require('../initDotEnv');
let init = require('../initializer');
let {
  BaseConfig,
} = require('partdcFramework');
let async = require('async');
let requestPromise = require('request-promise');
let q = require('q');
let promiseLimit = require('p-limit');
let us = require('underscore');
let rp = require('request-promise');


class TestRest {

  constructor() {
  }

  async getPdfUrl(url,fileName){
    let defer = q.defer();
    const path = '../../../../codal_pdf_files/' + fileName +`.pdf`;
    const filePath = fs.createWriteStream(path);
    // let config = {
    //   method: 'GET',
    //   url: url
    // };
    // let response = await rp(config);
    // if (response) {
    //   response.pipe(filePath);
    //   filePath.on('finish',async () => {
    //     await BaseConfig.mongoDBO.collection('pdfUrls').updateOne({tracingNo : fileName},{$set : {status :false}});
    //     filePath.close();
    //     defer.resolve(true);
    //     console.log('ok');
    //   })
    // }
    // else{
    //   defer.reject('err');
    // }
    await https.get(url,(res,err) => {
      if(err){
        defer.reject('err');
      }
      else{
          res.pipe(filePath);
          filePath.on('finish',async () => {
            await BaseConfig.mongoDBO.collection('pdfUrls').updateOne({tracingNo : fileName},{$set : {status :false}});
            filePath.close();
            defer.resolve(true);
            console.log('ok');
          })
      }
    })
    return defer.promise;
  }

  async pdfDownload(count) {
    let defer = q.defer();
    try {
      // const length = fs.readdirSync('./newFolder').length
      let list = await BaseConfig.mongoDBO.collection('pdfUrls').find({}).limit(20).toArray();
      async.eachSeries(list,async (item) => {
        try {
          console.log(count);
          await this.getPdfUrl(item.pdfUrl.replaceAll('http','https'),item.tracingNo);
          count++;
        }
        catch (e) {
          utility.consoleLog(e);
        }
      },(err) =>{
        if (err)
          defer.reject(err)
        else
          defer.resolve();
      })
    }
    catch (e) {
      utility.consoleLog(e);
      defer.reject(e);
    }
    return defer.promise;
  }

  async getStatementsMongo(){
    let list1 = await BaseConfig.mongoDBO.collection('CodalStatements').find({
      "pdfUrl" : {
        "$nin" : [null,""]
      },
      "date" :{"$gte" : "13950101"}
    },{fields : {tracingNo :1,pdfUrl :1,_id:0}}).limit(10000).toArray();

    // async.each(list1,async (item)=>{
    let res = await BaseConfig.mongoDBO.collection('pdfUrls').insertMany(list1)
    // })
  }


  async initScript(){
    await init.initMongoRedis();
    // await getStatementsMongo();
    let count  = 1;
    await this.getPdfUrl('https://www.codal.ir/DownloadFile.aspx?hs=N9qRN2TTjGNlH57fHbQA3A%3d%3d&ft=1005&let=58')
    // await this.pdfDownload(count);
    setInterval(async ()=>{
      await this.pdfDownload(count)
    }, 3000);
  }
}


new TestRest().initScript().then(() => {
  utility.consoleLog();
});
