const userRouter = require('./user');
const googleServiceSpredSheetApi = require('./googleServiceSpredSheetApi');
const googleServicePickerApi = require('./googlePickerApi');
function route(app) {
  app.use('/api/user',userRouter);
  app.use('/api/google-service-spredsheet-api',googleServiceSpredSheetApi);
  app.use('/api/google-service-picker-api',googleServicePickerApi);
  app.use('/view/picker',googleServicePickerApi);
}
module.exports = route;