/**
 * 用户相关服务
 */
const util = require('../utils/util.js');
const api = require('../config/api.js');
var first = true;

/**
 * Promise封装wx.checkSession
 */
function checkSession() {
  return new Promise(function (resolve, reject) {
    wx.checkSession({
      success: function () {
        resolve(true);
      },
      fail: function () {
        reject(false);
      }
    })
  });
}

/**
 * Promise封装wx.login
 */
function login() {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        if (res.code) {
          resolve(res);
        } else {
          reject(res);
        }
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * Promise封装wx.getUserInfo
 */
function getUserInfo() {
  return new Promise(function (resolve, reject) {
    wx.getUserInfo({
      withCredentials: true,
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        if (first) {
          // wx.navigateTo({
          //   url: "/pages/auth/wxLogin/login?authorization=true"
          // });
          first = false;
        } else {
          wx.showModal({
            title: '用户未授权',
            content: '请给予您的用户信息授权。',
            cancelColor: '#666666',
            confirmColor: '#31c4a1',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                    if (res.authSetting["scope.userInfo"] === true) {
                      wx.getUserInfo({
                        withCredentials: true,
                        success: function (res) {
                          resolve(res);
                        },
                      })
                    }
                  }
                })
              } else if (res.cancel) {
                // wx.navigateBack({
                //   delta: 1
                // })
                getUserInfo();
              }
            }
          })
        }
      }
    })
  });
}

/**
 * 调用微信登录
 */
function loginByWeixin() {

  let code = null;
  return new Promise(function (resolve, reject) {
    return login().then((res) => {
      code = res.code;
      return getUserInfo();
    }).then((userInfo) => {
      //登录远程服务器
      util.request(api.AuthLoginByWeixin).then(res => {
        console.log(res)
        if (res.errno === 0) {
          //存储用户信息
          wx.setStorageSync('token', res.data.token);
          resolve(res);
        } else {
          reject(res);
        }
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    })
  });
}

/**
 * 判断用户是否登录
 */
function checkLogin() {
  return new Promise(function (resolve, reject) {
    if (wx.getStorageSync('token')) {
      checkSession().then(() => {
        resolve(true);
      }).catch(() => {
        reject(false);
      });
    } else {
      reject(false);
    }
  });
}


module.exports = {
  loginByWeixin,
  checkLogin,
};
