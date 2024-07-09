const userRouter = require('./user');
const googleServiceSpredSheetApi = require('./googleServiceSpredSheetApi');
function route(app) {
  app.use('/api/user',userRouter);
  app.use('/api/google-service-spredsheet-api',googleServiceSpredSheetApi);
}
module.exports = route;