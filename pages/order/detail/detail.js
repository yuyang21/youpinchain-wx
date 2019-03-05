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
      title: '待收货',
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
    showAlertTip: false,
    showPoster: false,
    currentPage: '',
    page: 1,
    size: 10,
    members: [],
    totalPages: 1,
    goods: {},
    groupPrice: '',
    joinNum: 0,
    endTimeDown: 0
  },
  onLoad (options) {
    this.setData({
      orderId: options.orderId,
      groupMyId: options.groupMyId ? options.groupMyId : null
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
        showLoading: false,
        groupPrice: res.data.groupPrice
      })
      that.expCodes();
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
      if (orderData.status === 200) {
        this.getMembers(this.data.page, this.data.size);
      }
    })
  },
  expCodes () {
    let that = this;
    let orderData = that.data.orderData;
    util.request(api.expCodes).then(res => {
      if (res.errno !== 0) {
        return;
      }
      orderData.expName = res.data[this.data.orderData.expCode]
      that.setData({
        orderData: orderData
      })
    })
  },
  copyExpNo () {
    let that = this;
    wx.setClipboardData({
      data: that.data.orderData.expNo,
      success: function(res) {
        wx.getClipboardData({
          success: function(res) {
            console.log(res.data) // data
          }
        })
      }
    })
  },
  getMembers(page, size) {
    let that = this;
    util.countdown(that);
    util.request('/groups/0', {
      groupMyId: that.data.groupMyId
    }).then(res => {
      that.setData({
        joinNum: res.data.groupMy.rulesNum - res.data.groupMy.joinNum,
        endTimeDown: Math.round((res.data.groupMy.endTime - new Date().getTime()) / 1000)
      })
      util.countdown(that);
    })
    util.request('/groups/0/groupMys/' + that.data.groupMyId + '/members', {
      page: page,
      pageSize: size
    }).then(res => {
      that.setData({
        members: res.data.members,
        totalPages: res.data.totalPages
      })
    })
  },
  loadMoreMember() {
    this.setData({
      page: this.data.page + 1
    })
    this.getMembers(this.data.page, this.data.size);
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
  cancelOrder(orderId) {
    var that = this;
    util.request(api.cancelOrder + orderId, {}, 'DELETE').then(res => {
      if (res.errno !== 0) {
        util.showErrorToast(res.errmsg);
        return;
      }
      util.showSuccessToast("成功");
      wx.navigateTo({
        url: '../list/list'
      })
    })
  },
  // 确认收货
  confirmOrder(orderId) {
    var that = this;
    util.request('/orders/' + orderId + '/confirm', {}, "POST").then(res => {
      if (res.errno !== 0) {
        util.showErrorToast("失败");
        return;
      }
      util.showSuccessToast("成功");
      wx.navigateTo({
        url: '../list/list'
      })
    })
  },
  toPay(e) {
    let orderId = e.currentTarget.dataset.orderId;
    util.request('/orders/' + orderId + '/prepay', {
      type: '1111111111'
    }, "POST").then(resp => {
      if (resp.errno === 403) {
        util.showErrorToast(resp.errmsg);
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
        })
      }
    })
  },
  toggleAlert(e) {
    // e.detail // 自定义组件触发事件时提供的detail对象
    this.setData({
      showAlertTip: !this.data.showAlertTip
    })
  },
  closeMask () {
    this.setData({
      showPoster: false
    })
  },
  showShareBox (e) {
    let groupMyId = this.data.groupMyId;
    let route = '';
    let goods = JSON.parse(wx.getStorageSync('orderProduct'));
    if (goods.productType === 1) { // 1套装，2单品
      route = {
        page: 'pages/group/groupDet/groupDet',
        parmas: 'P=' + goods.productId + ',G=' + groupMyId
      };
    } else {
      route = {
        page: 'pages/goods/goods',
        parmas: 'P=' + goods.productId + ',B=' + goods.brandId + ',G=' + groupMyId
      };
    }
    this.setData({
      goods: goods,
      showPoster: !this.data.showPoster,
      currentPage: JSON.stringify(route)
    })
  }
})
