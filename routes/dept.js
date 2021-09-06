const router = require('koa-router')();
const Dept = require('./../models/deptSchema');
const util = require('../utils/util');
router.prefix("/dept");

router.get("/list", async (ctx) => {
  const { deptName } = ctx.request.query;
  const params = {};
  if (deptName) params.deptName = deptName;
  const rooterList = await Dept.find(params).lean()
  if (deptName) {
    ctx.body = util.success(rooterList)
  } else {
    const res = [];
    getTreeDept(rooterList, null, res);
    ctx.body = util.success(res)
  }
})

function getTreeDept(rootList, id, arr) {
  rootList.forEach(item => {
    if (!id && item.parentId.length === 0) {
      arr.push(item);
    } else {
      const flg = item.parentId[item.parentId.length - 1];
      if (String(flg) == String(id)) {
        arr.push(item);
      }
    }
  })
  arr.forEach(item => {
    item.children = []
    getTreeDept(rootList, item._id, item.children)
    if (item.children.length == 0) {
      delete item.children;
    }
  })
  return arr;
}


router.post("/operate", async (ctx) => {
  const { _id, action, ...payload } = ctx.request.body;
  try {
    let info = ""
    if (action === "add") {
      await Dept.create(payload);
      info = "添加成功"
    } else if (action === "edit") {
      payload.updateTime = new Date();
      await Dept.findByIdAndUpdate(_id, payload)
      info = "编辑成功"
    } else if (action === "delete") {
      await Dept.findByIdAndRemove(_id);
      await Dept.deleteMany({ parentId: { $all: [_id] } })
      info = "删除成功"
    }
    ctx.body = util.success("", info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router