const userRouter = require('./user');
const googleService = require('./googleService');
function route(app) {
  app.use('/api/user',userRouter);
  app.use('/api/google-service',googleService);
}
module.exports = route;