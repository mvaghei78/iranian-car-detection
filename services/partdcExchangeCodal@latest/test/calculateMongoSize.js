let async = require('async');
let request = require('request-promise');

(async (env)=>{
  let cols = [
    "BiAdjArchive",
    "BiAdjLatestData",
    "InnerStockHistory",
    "RSIArchive14",
    "RSILatestData",
    "TODAArchive",
    "TODALatestData",
    "TODAReport",
    "TehranIndexesArchiveStatistic",
    "buySellPotency",
    "clientTypeArchive",
    "errors",
    "indexArchiveData",
    "indexInnerDay",
    "indexLastData",
    "innerStockHistoryTable",
    "instrument",
    "marketActivityLast",
    "momentary_bestLimits",
    "momentary_clientTypes",
    "momentary_symbolsInfo",
    "momentary_symbolsTrade",
    "observerMessages",
    "sector",
    "serviceLogs",
    "services",
    "subSector",
    "symbolInformation",
    "tmpSymbolInfo",
    "topIndustryGroups",
    "volumePotency"
  ];
  let result=[];
  let totalSize=0;
  let storageSize=0;
  let url;
  url = `http://partfdfexchange-${env==='dev' ? 'dev':'prod'}.partdp.ir/service/partfdfExchange@latest/collectionStatistics?collectionName=`;
  return new Promise((res)=> {
    async.eachSeries(cols, async col => {
      try{
        let data = await request({url:url+col,headers: {}});
        data = JSON.parse(data);
        data = data.data.result;
        result.push({
          "ns": data.ns,
          "size": (data.size / (1024 * 1024)).toFixed(2),
          "count": data.count+'',
          "storageSize": data.storageSize+'',
        });
        totalSize+= +((data.size / (1024 * 1024)).toFixed(2));
        storageSize+= +((data.storageSize / (1024 * 1024)).toFixed(2));
      }catch(err){
        console.log(err);
      }
    }, () => {
      result = result.sort((a,b)=> b.size - a.size);
      res([{result, size: storageSize.toFixed(2), storageSize:storageSize.toFixed(2) }]);
    });
  });
})('dev');