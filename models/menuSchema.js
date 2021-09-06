const mongoose = require('mongoose');

var menuSchema = mongoose.Schema({
  parentId: [mongoose.Types.ObjectId],
  menuName: String,
  menuType: Number,
  icon: String,
  path: String,
  component: String,
  menuCode: String,//权限标识
  menuState: Number,//菜单状态
  createTime: {
    type: Date,
    default: Date.now()
  },//创建时间
  lastLoginTime: {
    type: Date,
    default: Date.now()
  },//更新时间
});

module.exports = mongoose.model('menu', menuSchema);