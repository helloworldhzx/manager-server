const router = require('koa-router')()
const Menu = require('../models/menuSchema')
const Role = require('../models/roleSchema')
const util = require('../utils/util')
router.prefix('/menu')

// 全部菜单
router.get("/list", async (ctx) => {
  const { menuName, menuState } = ctx.request.query;
  const params = {}
  if (menuName) params.menuName = menuName;
  if (menuState) params.menuState = menuState;
  const rootList = await Menu.find(params).lean();
  const tree = util.getTreeMenu(rootList, null, []);
  ctx.body = util.success(tree);
})

// 权限菜单
router.get("/permissionList", async (ctx) => {
  const authorization = ctx.request.header.authorization
  const userInfo = util.decoded(authorization);
  const menuList = await getPermissionMenu(userInfo.role, userInfo.roleList)
  const actionList = getAction(menuList);
  ctx.body = util.success({ menuList, actionList })
})

// 根据用户权限查看菜单
async function getPermissionMenu(role, roleKeys) {
  let rootList = []
  if (role === 0) {
    rootList = await Menu.find().lean()
  } else {
    // 先根据用户roleList查出对应的角色列表
    const roleList = await Role.find({ _id: { $in: roleKeys } })
    // 将角色列表中的菜单id合并去重
    let arr = [];
    roleList.forEach(item => {
      const { checkedKeys, halfCheckedKeys } = item.permissionList;
      arr = arr.concat([...checkedKeys, ...halfCheckedKeys])
    })
    const menuKeys = [...new Set(arr)]
    // 根据菜单id去查询
    rootList = await Menu.find({ _id: { $in: menuKeys } }).lean()
  }
  return util.getTreeMenu(rootList, null, [])
}

function getAction(list) {
  const actionList = []
  function deep(arr) {
    arr.forEach(item => {
      if (item.action) {
        item.action.forEach(iitem => actionList.push(iitem.menuCode))
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    })
  }
  deep(list);
  return actionList
}

router.post("/operate", async (ctx) => {
  const { _id, action, ...payload } = ctx.request.body;
  try {
    let msg = ""
    if (action === "add") {
      if (!payload.menuName) {
        ctx.body = util.fail('参数有误')
        return;
      }
      await Menu.create(payload);
      msg = '添加成功'
    } else if (action === "edit") {
      if (!payload.menuName) {
        ctx.body = util.fail('参数有误')
        return;
      }
      await Menu.findOneAndUpdate({ _id }, { ...payload })
      msg = '编辑成功'
    } else {
      await Menu.findByIdAndRemove({ _id })
      await Menu.deleteMany({ parentId: { $all: [_id] } })
      msg = '删除成功'
    }
    ctx.body = util.success('', msg)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }

})

module.exports = router
