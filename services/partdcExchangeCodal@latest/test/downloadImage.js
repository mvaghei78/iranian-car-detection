let q = require('q');
let async = require('async/dist/async');
let request = require('request');
let fs = require('fs');
/**
 * دانلود عکس و ریختن در لوکال
 * @param originalImageLink
 * @param uploadedImagePath
 * @returns {Promise<P|T>}
 */
async function downloadFile(originalImageLink, uploadedImagePath) {
    let defer = q.defer();
    try {
      let url = encodeURI(originalImageLink);
      let path = uploadedImagePath;
      request.head(url, (err) => {
        if (err)
          defer.reject(err);
        else {
          request(url)
            .pipe(fs.createWriteStream(path))
            .on('close', () => {
              defer.resolve(true);
            })
            .on('error', error => {
              defer.reject(error);
            });
        }

      });

    }
    catch (e) {
      defer.reject(false);
    }

    return defer.promise;
}

downloadFile('https://s100.divarcdn.com/static/pictures/1645427515/QYi3nKVJ.jpg','F:\\projectFiles\\divar\\dcDivarInfo\\services\\partdcExchangeCodal@latest\\test\\images\\image.jpg')