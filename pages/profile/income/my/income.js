const util = require('../../../../utils/util')
const api = require('../../../../config/api')
Page({
  data: {
    profileInfo: {},
    todayInfo: {},
    levels: [],
    level: null,
    busy: false,
    rewardGrades: {}
  },
  onLoad: function (options) {

  },
  onShow: function () {
    this.getInfo();
  },
  getInfo() {
    let that = this
    util.request(api.accountsInfo).then(function (res) {
      that.setData({
        profileInfo: res.data
      })
    })
    util.request(api.todayProfit).then(function (res) {
      that.setData({
        todayInfo: res.data
      })
    })
    util.request(api.rewardGrade).then((res) => {
      that.setData({
        level: res.data.sortNo
      })
    })
    util.request(api.rewardGrades).then(res => {
      that.setData({
        levels: res.data.data
      })
    })
  },
  withdraws(event) {
    let that = this;
    let amount = event.currentTarget.dataset.canWithdrawAmount;
    if (that.data.busy) {
      return;
    }
    that.setData({
      busy: true
    })
    setTimeout(function () {
      that.setData({
        busy: false
      })
    }, 2000)
    if (amount <= 0) {
      return;
    }
    util.request(api.withdraw, {
      amount: amount
    }, 'POST').then(res => {
      if (res.errno !== 0) {
        util.showErrorToast(res.errmsg);
      } else {
        util.showSuccessToast('提现成功');
        that.getInfo();
      }
    })
  }
})