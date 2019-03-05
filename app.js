var util = require('./utils/util.js');
var api = require('./config/api.js');
var user = require('./services/user.js');
App({
    globalData: {
        version: '1.0.18',
        userInfo: null,
        hasLogin: false,
        first: true,
        cartNum: 0
    },
    onLaunch: function () {
        // // 展示本地存储能力
        // var logs = wx.getStorageSync('logs') || []
        // logs.unshift(Date.now())
        // wx.setStorageSync('logs', logs)

        // 未登录
        if (!wx.getStorageSync('token')) {
          this.toLogin();
        } else {
          var that = this
          util.request(api.userInfo, {}, 'GET').then(function (ret) {
              if (ret.errno !== 0) {
                  that.toLogin();
              }
          })
        }

        // // 登录
        // wx.login({
        //   success: res => {
        //     console.log(res)
        //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
        //   }
        // })
        // // 获取用户信息
        // wx.getSetting({
        //   success: res => {
        //     console.log(res.authSetting['scope.userInfo'])
        //     if (res.authSetting['scope.userInfo']) {
        //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        //       wx.getUserInfo({
        //         success: res => {
        //           // 可以将 res 发送给后台解码出 unionId
        //           this.globalData.userInfo = res.userInfo
        //
        //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        //           // 所以此处加入 callback 以防止这种情况
        //           if (this.userInfoReadyCallback) {
        //             this.userInfoReadyCallback(res)
        //           }
        //         }
        //       })
        //     } else {
        //       // 切换到登录页面
        //       wx.navigateTo({
        //           url: '/pages/auth/login/login'
        //       });
        //     }
        //   }
        // })


    },
    toLogin: function() {
        let that = this
        wx.login({
            success: wxLoginRes => {
                // 获取用户信息
                wx.getSetting({
                    success: settingSuccess => {
                        if (settingSuccess.authSetting['scope.userInfo']) {
                            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                            wx.getUserInfo({
                                success: userInfoRes => {
                                    util.request(api.AuthLoginByWeixin, {
                                        code: wxLoginRes.code,
                                        userInfo: userInfoRes
                                    }, 'POST').then(function (ret) {
                                        let pages = getCurrentPages()
                                        if (ret.errno === 0) {
                                            wx.setStorageSync('token', ret.data.token);
                                            if (pages.length >= 1) {
                                              let currentPage = pages[pages.length - 1];
                                              console.log('reload page：：' + currentPage.route)
                                              currentPage.onLoad(currentPage.options);
                                              currentPage.onShow();
                                              // wx.reLaunch({
                                              //   url: '/' + pages[pages.length -1].route
                                              // })
                                            } else {
                                              wx.switchTab({
                                                url: '/pages/group/current/current'
                                              })
                                            }

                                        } else {
                                            wx.navigateTo({
                                                url: '/pages/auth/login/login'
                                            });
                                        }
                                    })
                                }
                            })
                        } else {
                            // 切换到登录页面
                            wx.navigateTo({
                                url: '/pages/auth/login/login'
                            });
                        }
                    }
                })
            }
        })
    },
    findCart () {
        let that = this;
        util.request(api.findCart, {page: 1, size: 100}, 'GET').then(res => {
            if (res.errno !== 0) {
                return
            }
            let cart = res.data.cart;
            let cartNum = 0;
            if (cart.length > 0) {
                cart.forEach(cart => {
                    if (cart.cartListDtos.length > 0) {
                        cartNum += cart.cartListDtos.length
                    }
                    that.globalData.cartNum = cartNum;
                    wx.setTabBarBadge({
                        index: 1,
                        text: String(cartNum),
                        success: function (e) {
                        }
                    })
                })
            } else {
                that.globalData.cartNum = cartNum;
                wx.removeTabBarBadge({
                    index: 1,
                    success: function (e) {
                    }
                })
            }
        })
    },
    updateManage () {
        // 获取小程序更新机制兼容
        if (wx.canIUse('getUpdateManager')) {
            const updateManager = wx.getUpdateManager()
            updateManager.onCheckForUpdate(function (res) {
                // 请求完新版本信息的回调
                if (res.hasUpdate) {
                    updateManager.onUpdateReady(function () {
                        wx.showModal({
                            title: '更新提示',
                            content: '新版本已经准备好，是否重启应用？',
                            success: function (res) {
                                if (res.confirm) {
                                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                                    updateManager.applyUpdate()
                                }
                            }
                        })
                    })
                    updateManager.onUpdateFailed(function () {
                        // 新的版本下载失败
                        wx.showModal({
                            title: '已经有新版本了哟~',
                            content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
                        })
                    })
                }
            })
        } else {
            // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
            wx.showModal({
            title: '提示',
            content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
            })
        }
    },
    onShow: function () {
        this.findCart();
        this.updateManage();
    },
})
