const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    userInfo: {
    },
    userImgUrl: '',
    username: '',
    showAlertTip: false
  },
  onLoad: function () {
  },
  onShow: function () {
    this.getUserInfo();
    this.getOrderStat();
  },
  getOrderStat () {
    let that = this;
    let userInfo = this.data.userInfo;
    util.request(api.orderStat).then(res => {
      if (res.errno !== 0) {
        return;
      }
      res.data.orderStat.forEach(stat => {
        if (stat.status == 101) {
          userInfo.unpaid = stat.count;
        }
        if (stat.status == 201) {
          userInfo.undeliry = stat.count;
        }
        if (stat.status == 301) {
          userInfo.delived = stat.count;
        }
        that.setData({
          userInfo: userInfo
        })
      })
    })
  },
  getUserInfo () {
    let that = this;
    util.request(api.userInfo).then(function (res) {
      if (res.errno == 0) {
        that.setData({
          userImgUrl: res.data.headImgUrl.replace("http://", "https://"),
          username: res.data.nickName
        })
      }
    })
  },
  toggleAlert () {
    this.setData({
      showAlertTip: !this.data.showAlertTip
    })
    if (this.data.showAlertTip) {
      wx.hideTabBar({
        animation: true
      })
    } else {
      wx.showTabBar({
        animation: true
      })
    }
  }
})
