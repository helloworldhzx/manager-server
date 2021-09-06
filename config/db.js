const mongoose = require('mongoose');
const config = require('./index');
const log4js = require('../utils/log4js')
mongoose.connect(config.URL);

var db = mongoose.connection;
db.on('error', function(){
  log4js.error('=========数据库连接失败=======')
});
db.once('open', function() {
  log4js.info('=========数据库连接成功=======')
});