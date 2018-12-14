const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function showErrorToast(msg) {
  wx.showToast({
    title: msg,
    image: '/static/images/icon_error.png'
  })
}

/**
 * 封封微信的的request
 */
function request(url, data = {}, method = "GET") {
  console.log(getApp())
  return new Promise(function (resolve, reject) {
    wx.request({
      url: getApp().config.api_host + url,
      data: data,
      method: method,
      header: {
        'Content-Type': 'application/json',
        'X-youpinchain-Token': wx.getStorageSync('token')
      },
      success: function (res) {

        if (res.statusCode == 200) {
          if (res.data.errno == 401) {
            // 微信登陆失效
            console.log("util 401退出到微信登录");
            try {
              wx.removeStorageSync('userInfo');
              wx.removeStorageSync('token');
            } catch (e) {
              // Do something when catch error
            }
            // 切换到登录页面
            // wx.navigateTo({
            //   url: '/pages/auth/wxLogin/login'
            // });
            console.log('登录失败')
          }

          if (res.data.errno == 410) {
            //权限账号登陆失效
            // 清除登录相关内容
            // try {
            //   wx.removeStorageSync('userInfo');
            //   wx.removeStorageSync('token');
            // } catch (e) {
            //   // Do something when catch error
            // }
            // 切换到登录页面
            wx.navigateTo({
              url: '/pages/auth/login/login'
            });
          } else {
            resolve(res.data);
          }
        } else {
          reject(res.errMsg);
        }

      },
      fail: function (err) {
        reject(err)
      }
    })
  });
}

module.exports = {
  formatTime,
  request,
  showErrorToast
}
