const api_host = 'http://youpinlian.datbc.com/youpin/wx'

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
    icon: 'none',
    duration: 2000
  })
}
function showSuccessToast(msg) {
  wx.showToast({
    title: msg,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 封装微信的的request
 */
function request(url, data = {}, method = "GET") {
  let that = getApp()
  return new Promise(function (resolve, reject) {
    wx.request({
      url: api_host + url,
      data: data,
      method: method,
      header: {
        'Content-Type': 'application/json',
        'X-youpinchain-Token': wx.getStorageSync('token'),
        'app-version': that !== undefined && that.globalData !== undefined ? that.globalData.version : ''
      },
      success: function (res) {
        console.log(url);
        console.log(res);
        if (res.statusCode === 200) {
          resolve(res.data);
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
/**
 * 转发设置内容
 * @param {转发来源} option
 * @param { title: 标题, path: 路径, imgUrl: 图片链接} obj
 */
const shareEvent = (option, obj) => {
  let shareObj = {
    title: obj.title,
    path: obj.path,
    imgUrl: obj.imgUrl,
    success(res) {
      // 转发成功之后的回调
      if (res.errMsg === 'shareAppMessage:ok') { }
    },
    fail(res) {
      // 转发失败之后的回调
      if (res.errMsg === 'shareAppMessage:fail cancel') {
        // 用户取消转发
      } else if (res.errMsg === 'shareAppMessage:fail') {
        // 转发失败，其中 detail message 为详细失败信息
      }
    },
    complete() {
      // 转发结束之后的回调（转发成不成功都会执行）
    }
  };
  if (option.from === 'button') {
    // 来自页面内转发按钮
    // console.log(option.target)
  }
  return shareObj;
}
/**
 * 使用组件中倒计时变量名必须为 endTimeDown
 * @param {*} that.data.endTimeDown 倒计时时间戳
 */
function countdown(that) {
  var second = that.data.endTimeDown
  if (second == 0) {
    // console.log("Time Out...");
    clearTimeout(time)
    return;
  }
  var time = setTimeout(function () {
    that.setData({
      endTimeDown: second - 1
    });
    countdown(that);
  }, 1000)
}
/**
 * 校验地址表单
 * @param {地址对象} address
 */
function checkAddress(address) {
  if (!address.name) {
    this.showErrorToast('请填写姓名')
    return false;
  }
  if (!address.mobile) {
    this.showErrorToast('请填写手机号')
    return false;
  }
  if (address.mobile.length < 11) {
    this.showErrorToast('请填写正确的手机号')
    return false;
  }
  if (!address.tipText) {
    this.showErrorToast('请选择所在地区')
    return false;
  }
  if (!address.address) {
    this.showErrorToast('请填写详细地址')
    return false;
  }

  return true;
}

function dealwithInviter(options) {
    let scene = {};
    if (options.scene) {
        let params = decodeURIComponent(options.scene).split(",");
        params.forEach(p => {
            scene[p.split("=")[0]] = p.split("=")[1];
            console.log('scene.' + p.split("=")[0] + ':' + p.split("=")[1])
        });
    }
    var inviter = options.inviter || scene.I || null;
    if (inviter != null && wx.getStorageSync('token')) {
        request('/oa/saveInviter', {
            inviter: inviter
        }, 'POST').then(res => {})
    }
}

const fsm = wx.getFileSystemManager();
const FILE_BASE_NAME = 'tmp_base64src';

const base64src = function(base64data) {
  return new Promise((resolve, reject) => {
    const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
    if (!format) {
      reject(new Error('ERROR_BASE64SRC_PARSE'));
    }
    const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}.${format}`;
    const buffer = wx.base64ToArrayBuffer(bodyData);
    fsm.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success() {
        resolve(filePath);
      },
      fail() {
        reject(new Error('ERROR_BASE64SRC_WRITE'));
      },
    });
  });
};


module.exports = {
  formatTime,
  request,
  showErrorToast,
  showSuccessToast,
  shareEvent,
  countdown,
  checkAddress,
  base64src,
  dealwithInviter
}
