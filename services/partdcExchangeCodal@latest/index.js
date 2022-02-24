require('./initDotEnv');
let routes = require('./routes');
let init = require('./initializer');
init.Initialize();
exports.httpHandlers = new routes().getRoutes();
