const mongoose = require('mongoose')

const leaveSchema = mongoose.Schema({
  orderNo: String,
  applyType: Number,
  startTime: Date,
  endTime: Date,
  applyUser: {
    userId: Number,
    userName: String,
    userEmail: String
  },
  leaveTime: String,
  reasons: String,
  auditUsers: String,
  curAuditUserName: String,
  applyState: Number,
  auditFlows: [],
  auditLogs: [],
  createTime: {
    type: Date,
    default: Date.now
  },
})

module.exports = mongoose.model('leave', leaveSchema)