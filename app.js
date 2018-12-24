var util = require('./utils/util.js');
var user = require('./services/user.js');
App({
  onLaunch: function () {
    // // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)

    // // 登录
    // wx.login({
    //   success: res => {
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //   }
    // })
    // // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           // 可以将 res 发送给后台解码出 unionId
    //           this.globalData.userInfo = res.userInfo

    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (this.userInfoReadyCallback) {
    //             this.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
  },
  // onShow: function (options) {
  //   user.checkLogin().then(res => {
  //     //console.log("app中判断登陆过了");
  //     this.globalData.hasLogin = true;
  //   }).catch(() => {
  //     //console.log("app中判断没有登陆");
  //     this.globalData.hasLogin = false;
  //     //没有登陆，这里进行微信登陆
  //     user.checkLogin().catch(() => {
  //       user.loginByWeixin().then(res => {
  //         this.globalData.hasLogin = true;
  //         //解决远程调试不进入页面问题
  //         wx.switchTab({
  //           url: "/pages/group/current/current"
  //         });
  //         // wx.navigateBack({
  //         //   delta: 1
  //         // })
  //       }).catch((err) => {
  //         //wx.setStorageSync('token', '86F0BAFF35531E1E0ACD43441A81074D');
  //         this.globalData.hasLogin = false;
  //         util.showErrorToast('微信登录失败');
  //         // wx.navigateTo({
  //         //   url: "/pages/auth/wxLogin/login"
  //         // });
  //       });

  //     });
  //   });
  // },
  globalData: {
    userInfo: null,
    hasLogin: false,
    first: true
  },
  config: {
    api_host: 'http://youpinlian.datbc.com/youpin/wx'
  }
})