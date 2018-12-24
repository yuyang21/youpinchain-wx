let App = getApp();
const util = require('../../../utils/util');
const api = require('../../../config/api');

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 授权登录
   */
  authorLogin: function (e) {
    let _this = this;
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      return false;
    }
    wx.showLoading({
      title: "正在登录",
      mask: true
    });
    // 执行微信登录
    wx.login({
      success: function (res) {
        // 发送用户信息
        util.request(api.AuthLoginByWeixin, {
          code: res.code,
          userInfo: e.detail.userInfo
        }, 'POST').then(function (ret) {
          if (ret.errno == 0) {
            wx.setStorageSync('token', ret.data.token);
            wx.switchTab({
              url: "/pages/group/current/current"
            });
          } else {
            util.showErrorToast('微信登录失败');
          }
        })
      }
    });
  }
})