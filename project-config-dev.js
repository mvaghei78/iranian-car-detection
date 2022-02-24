const fs = require('fs');
const path = require('path');

const numCPUs = 1;

let partLoggerConfig = {
  global: {
    //partMongoInterfaceConfig: partMongoInterfaceConfig,
    //partDataLayerInterfaceConfig: partDataLayerInterfaceConfig
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
        path: 'message.json'
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
        save: true,
        color: 'green',
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
        save: false,
        color: 'redBg',
        viewPath: true,
        priority: 0
      },
      info: {
        view: true,
        save: true,
        color: 'blueBg',
        viewPath: true,
        priority: 3
      },
      saves: {
        view: true,
        save: true,
        color: 'cyanBg',
        viewPath: true,
        priority: 4
      },
      mosifa: {
        view: true,
        save: false,
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

let globalAuthorize = {
  systemMetaOptions: {
    host: 'publicservices.apipart.ir',
    port: 80,
    path: '/service/systemMeta@4/which',
    method: 'POST',
    auth: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    }
  },
  partLoggerConfig: partLoggerConfig,
  gatewayHost: {
    protocol: 'http',
    host: 'apipart.ir',
    path: '/service/gateway/token',
    port: 80,
    method: 'POST',
    headers: {}
  }
};
let redisSessionConfig = {
  global: {
    partLoggerConfig: partLoggerConfig
  },
  activeDbInstance: {
    host: '127.0.0.1',
    port: 6379,
    db: 0
  },
  mapDbInstance: {
    host: '127.0.0.1',
    port: 6379,
    db: 1
  }
};
let partSessionManagerConfig = {
  global: {
    tokenLength: 25,
    sessionExpireTime: 120000,
    maxIdleTime: 20000,
    maxFailedLogins: 4,
    loginFailedTimeLimit: 20000,
    multiAccessTime: 5000,
    defaultVisitorObj: {
      username: 'visitor',
      roles: ['visitor'],
      samadUsername: 'visitor'
    },
    redisConfig: redisSessionConfig,
    partLoggerConfig: partLoggerConfig
  },
  instance: {}
};
let partJsonValidatorConfig = {
  global: {
    allErrors: true,
    v5: true
  },
  instance: {}
};
let partAuthorizeInterfaceConfigForProcessMode = {
  global: globalAuthorize,
  instance: {
    gatewayAuth: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    },
    customHeaders: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    }
  }
};
let partAuthorizeInterfaceConfigForProxyMode = {
  global: globalAuthorize,
  instance: {
    gatewayAuth: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    },
    customHeaders: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    }
  }
};
let partSamadInterfaceConfig = {
  global: {
    systemMetaOptions: {
      host: 'systemMeta.apipart.ir',
      port: 80,
      path: '/service/systemMeta@4/which',
      method: 'POST',
      auth: {
        user: 'YOUR USER',
        pass: 'YOUR PASS'
      }
    },
    partLoggerConfig: partLoggerConfig,
    gatewayHost: {
      protocol: 'http',
      host: 'apipart.ir',
      path: '/service/gateway/token',
      port: 80,
      method: 'POST',
      headers: {}
    },
  },
  instance: {
    gatewayAuth: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    },
    org: 'YOUR ORG',
    customHeaders: {
      user: 'YOUR USER',
      pass: 'YOUR PASS'
    }
  }
};
let partSecurityConfig = {
  global: {
    partLoggerConfig: partLoggerConfig,
  },
  instance: {
    host: '127.0.0.1',
    httpPort: 80,
    httpsPort: 443,
    maxBodyLength: 5e10,
    partSamadInterfaceConfig: partSamadInterfaceConfig
  }
};
let partUrlRewriterConfig = {
  global: {},
  instance: {
    rewriteRules: {
      './index.html': function (headers, data, session, callback) {
        /*
           اینجا باید با توجه به نیازمندی پروژه، آدرس فایل ایندکس را تعیین کنید
           کد زیر تنها یک نمونه است
           session.get(['roles'], function (error, result) {
           if (error) {
           callback(u.setCatched(config.e.dbError, error));
           }
           else {
           callback(null, './' + result.roles[0] + '/index.html');
           }
           });*/
        callback(null, './indexFolder/index.html');
      }
    }
  }
};
let partServeIndexConfig = {
  global: {},
  instance: {
    path: __dirname + path.sep + 'serveIndexHome'
  }
};
let partUploaderConfig = {
  global: {
    partLoggerConfig: partLoggerConfig
  },
  instance: {
    directory: 'uploads',
    fileSize: 200000000,
    fileLimit: 10,
  }
};

let frameworkConfig = {
  clusterSize: numCPUs,
  logDataChunks: false,
  proxyMode: {
    enabled: false,
    proxyToken: {
      required: false,
      field: 'gateway-token',
      partAuthorizeInterfaceConfig: partAuthorizeInterfaceConfigForProxyMode
    },
    proxyTable: {
      'a.nasser.com': {
        targetServers: ['127.0.0.1:83'],
        loadBalancer: function (targetServers) {
          return targetServers;
        }
      },
      'ehsan.com': {
        targetServers: ['127.0.0.1:122'],
        loadBalancer: function (allServers) {
          return allServers;
        }
      },
      'financialservices.apipart.ir': {
        targetServers: ['financialservices-dev.partdp.ir'],
        loadBalancer: returnAll
      },
      'financialservices.apipart-dev.ir': {
        targetServers: ['financialservices-dev.partdp.ir'],
        loadBalancer: returnAll
      },
      'sepam.apipart.ir': {
        targetServers: ['91.134.219.214'],
        loadBalancer: returnAll
      },
      'sepam.apipart-dev.ir': {
        targetServers: ['91.134.219.214'],
        loadBalancer: returnAll
      },
      'rasam.apipart.ir': {
        targetServers: ['192.168.1.126'],
        loadBalancer: returnAll
      },
      'rasam.apipart-dev.ir': {
        targetServers: ['192.168.1.126'],
        loadBalancer: returnAll
      },
      'irabo.apipart.ir': {
        targetServers: ['api.irabo.ir'],
        loadBalancer: returnAll
      },
      'irabo.apipart-dev.ir': {
        targetServers: ['api.irabo.ir'],
        loadBalancer: returnAll
      }, /*
       'ocr.apipart.ir': {
       targetServers: [ 'ocrservice-dev.partdp.ir'],
       loadBalancer: returnAll
       },
       'ocr.apipart-dev.ir': {
       targetServers: [ 'ocrservice-dev.partdp.ir'],
       loadBalancer: returnAll
       }*/
      'messaging.apipart.ir': {
        targetServers: ['messaging.partdp.ir'],
        loadBalancer: returnAll
      },
      'messaging.apipart-test.ir': {
        targetServers: ['messaging.partdp.ir'],
        loadBalancer: returnAll
      },
      'publicservices.apipart.ir': {
        targetServers: ['publicservices.partdp.ir'],
        loadBalancer: returnAll
      },
      'publicservices.apipart-test.ir': {
        targetServers: ['publicservices.partdp.ir'],
        loadBalancer: returnAll
      },
      'documentservice.apipart.ir': {
        targetServers: ['documentservice.partdp.ir'],
        loadBalancer: returnAll
      },
      'documentservice.apipart-test.ir': {
        targetServers: ['documentservice.partdp.ir'],
        loadBalancer: returnAll
      }
    },
    logConfig: {
      upstream: true,
      downstream: true
    }
  },
  processMode: {
    enabled: false,
    token: {
      required: true,
      field: 'process-token',
      partAuthorizeInterfaceConfig: partAuthorizeInterfaceConfigForProcessMode
    }
  },
  host: '127.0.0.1',
  httpServerConfig: {
    port: 82
  },
  httpsServerConfig: {
    port: 444,
    forceHttps: {
      'a.nasser.com': true,
      'y.milad.com': false
    },
    certificate: {
      key: fs.readFileSync('./certificate/key.pem'), // .toString()
      cert: fs.readFileSync('./certificate/key-cert.pem') // .toString()
    }
  },
  routeConfig: {
    'public': {
      path: __dirname + path.sep + 'public' + path.sep
    },
    'app': {
      checkSecurity: true,
      path: __dirname + path.sep + 'apps' + path.sep
    },
    'service': {
      /*checkSecurity: {
        type: 'token'
      },*/
      path: __dirname + path.sep + 'services' + path.sep
    }
  },
  partSessionManagerConfig: partSessionManagerConfig,
  partJsonValidatorConfig: partJsonValidatorConfig,
  partSecurityConfig: partSecurityConfig,
  partLoggerConfig: partLoggerConfig,
  partUrlRewriterConfig: partUrlRewriterConfig,
  partServeIndexConfig: partServeIndexConfig,
  partUploaderConfig: partUploaderConfig
};

/**
 * @param allServers
 * @returns {*}
 */
function returnAll(allServers) {
  return allServers;
}

exports.frameworkConfig = frameworkConfig;
