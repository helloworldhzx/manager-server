const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')
router.prefix('/role')

router.get("/allList", async (ctx) => {
  const res = await Role.find({}, "_id roleName");
  ctx.body = util.success(res)
})

router.get("/list", async (ctx) => {
  const { roleName } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const params = {}
  if (roleName) params.roleName = roleName;
  const list = await Role.find(params).skip(skipIndex).limit(page.pageSize);
  const total = await Role.countDocuments(params);
  ctx.body = util.success({ list, page: { total, ...page } });
})

router.post("/operate", async (ctx) => {
  const { _id, action, roleName, remark } = ctx.request.body;
  try {
    let msg = ""
    if (action === "add") {
      if (!roleName) {
        ctx.body = util.fail('参数有误')
        return;
      }
      await Role.create({ roleName, remark });
      msg = '添加成功'
    } else if (action === "edit") {
      if (!roleName) {
        ctx.body = util.fail('参数有误')
        return;
      }
      await Role.findByIdAndUpdate(_id, { roleName, remark })
      msg = '编辑成功'
    } else {
      console.log("=======>")
      const res = await Role.findByIdAndRemove(_id)
      console.log("=======>", res)
      msg = '删除成功'
    }
    ctx.body = util.success('', msg)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

router.post('/update/permission', async (ctx) => {
  const { _id, permissionList } = ctx.request.body;
  console.log(_id, permissionList)
  try {
    await Role.findByIdAndUpdate(_id, { permissionList });
    ctx.body = util.success("", "设置成功")
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router
