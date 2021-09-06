const router = require('koa-router')()
const User = require('../models/userSchema')
const Counter = require('../models/counterSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken');
const md5 = require('md5');
router.prefix('/user')

router.post('/login', async function (ctx) {
  const { userName, userPwd } = ctx.request.body;
  const res = await User.findOne({ userName, userPwd: md5(userPwd) },
    "userId userName userEmail state role deptId roleList").lean() // lean将MongooseDocuments对象转换成object
  if (res) {
    const token = jwt.sign(res, 'zz', { expiresIn: "1h" });
    res.token = 'Bearer ' + token
    ctx.body = util.success(res)
  } else {
    ctx.body = util.fail('账号或密码错误')
  }
})

router.get("/list", async (ctx) => {
  const { userName, state, userId } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const params = {}
  if (userName) params.userName = userName;
  if (userId) params.userId = userId;
  if (state && state != 0) params.state = state;
  const res = await User.find(params, { userPwd: 0, _id: 0 }).skip(skipIndex).limit(page.pageSize)
  const total = await User.countDocuments(params);
  ctx.body = util.success({ list: res, page: { ...page, total } });
})

router.get('/allList', async (ctx) => {
  const res = await User.find({}, "userId userName userEmail");
  ctx.body = util.success(res)
})

router.post("/operate", async (ctx) => {
  const { action, userName, deptId, userEmail, userId, _id, ...payload } = ctx.request.body;
  try {
    if (action === "add") {
      if (!userName || !deptId || !userEmail) {
        ctx.body = util.fail('参数有误')
        return;
      }
      const user = await User.findOne({ $or: [{ userName }, { userEmail }] })
      if (user) {
        ctx.body = util.fail('用户名或邮箱已存在')
        return;
      }
      const couter = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
      await new User({ userId: couter.sequence_value, userName, userEmail, deptId, role: 1, userPwd: md5("123456"), ...payload }).save();
      ctx.body = util.success('', '添加成功')
    } else {
      if (!deptId) {
        ctx.body = util.fail('参数有误')
        return;
      }
      await User.findOneAndUpdate({ userId }, { ...payload, deptId })
      ctx.body = util.success('', '编辑成功')
    }
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

router.post("/delete", async (ctx) => {
  const { userIds } = ctx.request.body;
  if (!userIds || userIds.length === 0) {
    ctx.body = util.fail("参数有误");
    return;
  }
  try {
    // const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
    const res = await User.remove({ userId: { $in: userIds } })
    ctx.body = util.success('', `成功删除${res.matchedCount}条`)
  } catch (error) {
    ctx.body = util.fail(error);
  }
})
module.exports = router
