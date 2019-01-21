const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    orderId: "",
    showLoading: true, //显示加载动画
    showAlertTip: false,
    status_text: [{
      title: '未发货',
      text: '您的订单还未发货～'
    }, {
      title: '已发货',
      text: '您的订单已经发货啦～'
    }, {
      title: '配送中',
      text: '您的订单正在配送中～'
    }, {
      title: '已完成',
      text: '您的订单已完成～'
    }, {
      title: '待支付',
      text: '您的订单待支付～'
    }],
    orderData: {},
    orderProduct: {},
    exp: {},
    showAlertTip: false
  },
  onLoad (options) {
    this.setData({
      orderId: options.orderId
    })
    let that = this;
    util.request('/orders/' + that.data.orderId).then(res => {
      if (res.errno !== 0) {
        return;
      }
      let orderData = res.data.orderInfo;

      //TODO 测试使用单号
      if (!orderData.expNo) {
        orderData.expNo = "821721174311";
      }
      that.setData({
        orderData: orderData,
        orderProduct: res.data.orderProduct,
        showLoading: false
      })
      if (that.data.orderData.handleOption.confirm && that.data.orderData.expNo) {
        util.request('/expresses/' + that.data.orderData.expCode + '/' + that.data.orderData.expNo).then(res => {
          if (res.errno !== 0) {
            return;
          }
          var trackData = JSON.parse(
            res.data
          );
          if (trackData.message === "ok") {
            that.setData({
              exp: trackData.data[0]
            })
          }
        })
      }
    })
  },
  goTrack () {
    if (!this.data.orderData.handleOption.confirm) {
      return
    }
    wx.navigateTo({
      url: '../track/track?expNo=' + this.data.orderData.expNo + '&expCode=' + this.data.orderData.expCode
    })
  },
  // 取消订单
  cancelOrder(e) {
    var that = this;
    let orderId = e.currentTarget.dataset.orderId;
    util.request(api.cancelOrder + orderId, {}, 'DELETE').then(res => {
      if (res.errno !== 0) {
        that.showErrMsg("失败");
        return;
      }
      wx.navigateTo({
        url: '../../order/list/list?showType=201'
      })
    })
  },
  // 确认收货
  confirmOrder(e) {
    var that = this;
    let orderId = e.currentTarget.dataset.orderId;
    util.request('/orders/' + orderId + '/confirm', {}, "POST").then(res => {
      if (res.errno !== 0) {
        that.showErrMsg("失败");
        return;
      }
      wx.navigateTo({
        url: '../../order/list/list?showType=401'
      })
    })
  },
  toPay(e) {
    var that = this;
    let orderId = e.currentTarget.dataset.orderId;
    util.request('/orders/' + orderId + '/prepay', {
      type: '1111111111'
    }, 'POST').then(resp => {
      if (resp.errno === 403) {
        that.showErrMsg(resp.errmsg)
      } else {
        wx.requestPayment({
          timeStamp: resp.data.timeStamp, //时间戳，自1970年以来的秒数
          nonceStr: resp.data.nonceStr, //随机串
          package: resp.data.packageValue,
          signType: resp.data.signType, //微信签名方式：
          paySign: resp.data.paySign, //微信签名
          success(res) {
            wx.navigateTo({
              url: '../../order/list/list'
            })
          },
          fail(res) {
            util.showErrorToast(res.errMsg);
          }
        });
      }
    })
  },
  toggleAlert (e) {
    // e.detail // 自定义组件触发事件时提供的detail对象
    this.setData({
      showAlertTip: !this.data.showAlertTip
    })
  }
})