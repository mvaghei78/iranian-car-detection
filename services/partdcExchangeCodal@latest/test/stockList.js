var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://partfdfexchange-prod.partdp.ir/service/partfdfExchange@latest/stockList',
  'headers': {
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
