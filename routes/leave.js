const router = require('koa-router')();
const Leave = require('../models/leaveSchema');
const Dept = require('../models/deptSchema');
const util = require('../utils/util');

router.prefix("/leave")

router.get("/list", async (ctx) => {
  const { type, applyState } = ctx.request.query
  const { userId } = util.decoded(ctx.request.header.authorization);
  const { page, skipIndex } = util.pager(ctx.request.query);
  const params = {}
  if (type === "approve") {
    params["auditFlows.userId"] = userId;
  } else {
    params["applyUser.userId"] = userId;
    if (applyState) params.applyState = applyState;
  }
  const list = await Leave.find(params).skip(skipIndex).limit(page.pageSize)
  const total = await Leave.countDocuments(params)
  ctx.body = util.success({ list, page: { ...page, total } })
})

router.post("/operate", async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  const { userId, userName, userEmail, deptId } = util.decoded(ctx.request.header.authorization);
  if (action === "add") {
    const count = await Leave.countDocuments({});
    params.orderNo = `XJ${util.formateDate(new Date, "yyyy-MM-dd")}${count}`;
    params.applyUser = { userId, userName, userEmail };
    // 获取当前登录人所属的部门
    const id = deptId.pop()
    const auditFlows = []
    const dept = await Dept.findById(id, "userId userName userEmail"); // 部门负责人审批
    params.curAuditUserName = dept.userName; // 新增时设置当前审批人
    params.auditUsers = dept.userName;
    auditFlows.push(dept);
    const userList = await Dept.find({ deptName: { $in: ["财务部门", "人事部门"] } }, "userId userName userEmail")
    userList.forEach(item => {
      auditFlows.push(item)
      params.auditUsers += "," + item.userName
    })
    params.applyState = 1
    params.auditLogs = []
    params.auditFlows = auditFlows
    Leave.create(params)
  } else if (action === "delete") {
    await Leave.findByIdAndUpdate(_id, { applyState: 5 })
  }
  ctx.body = util.success("", "成功")
})

router.post("/approve", async (ctx) => {
  const { _id, action, remark } = ctx.request.body;
  try {
    const { userId, userName, userEmail } = util.decoded(ctx.request.header.authorization);
    const { auditFlows, auditLogs } = await Leave.findById(_id);
    const params = { remark }
    if (auditFlows.length === auditLogs.length) {
      util.fail("单据有问题")
      return
    }
    if (action === "pass") {
      if (auditFlows.length > auditLogs.length + 1) {
        params.applyState = 2
        params.curAuditUserName = auditFlows[auditLogs.length + 1].userName
      } else {
        params.applyState = 4
      }
    } else if (action === "refuse") {
      params.applyState = 3
    }
    const logs = [...auditLogs, { userId, userName, userEmail, remark, action: action == 'refuse' ? "审核拒绝" : "审核通过" }]
    params.auditLogs = logs
    await Leave.findByIdAndUpdate(_id, params)
    ctx.body = util.success("", "审批成功")
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router;