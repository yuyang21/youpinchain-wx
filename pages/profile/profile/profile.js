const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    userInfo: {
      userImgUrl: ''
    }
  },
  onLoad: function () {
  },
  onShow: function () {
    this.getUserInfo();
    this.getOrderStat();
  },
  getOrderStat () {
    let that = this;
    util.request(api.orderStat).then(res => {
      if (res.errno !== 0) {
        return;
      }
      res.data.orderStat.forEach(stat => {
        if (stat.status == 101) {
          that.setData({
            userInfo: {
              unpaid: stat.count
            }
          })
        }
        if (stat.status == 201) {
          that.setData({
            userInfo: {
              undeliry: stat.count
            }
          })
        }
        if (stat.status == 301) {
          that.setData({
            userInfo: {
              delived: stat.count
            }
          })
        }
      })
    })
  },
  getUserInfo () {
    let that = this;
    util.request(api.userInfo).then(function (res) {
      if (res.errno == 0) {
        that.setData({
          userInfo: {
            userImgUrl: res.data.headImgUrl,
            username: res.data.nickName
          }
        })
      }
    })
  }
})
