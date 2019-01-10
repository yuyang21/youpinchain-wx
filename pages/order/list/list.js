const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    activeTab: 0,
    page: 1,
    size: 4,
    totalPage: 1,
    loading: true,
    loaded: false,
    showAlertTip: false,
    showRefundOrderTip: false,
    refundOrderId: null,
    status_title: ["待支付", "待发货", "已发货", "已完成", "已取消"],
    orderList: [],
    tabList: [
      {
        tab: '全部',
        showType: 0
      },
      {
        tab: '待支付',
        showType: 101
      },
      {
        tab: '待发货',
        showType: 201
      },
      {
        tab: '已发货',
        showType: 301
      },
      {
        tab: '已完成',
        showType: 401
      }
    ],
  },
  onLoad: function (options) {
    this.setData({
      activeTab: options.showType || 0
    })
  },
  onShow: function () {
    this.setData({
      orderList: []
    })
    this.getOrderList(this.data.page, this.data.size, this.data.activeTab);
    wx.showTabBar()
  },
  findOrder (e) {
    let index = e.currentTarget.dataset.showType;
    if (this.data.activeTab !== index) {
      this.setData({
        activeTab: index,
        orderList: [],
        page: 1 
      })
      this.getOrderList(this.data.page, this.data.size, index);
    }
  },
  // 取消订单
  cancelOrder(orderId) {
    cancelOrder(orderId).then(res => {
      if (res.errno !== 0) {
        util.showErrorToast("失败");
        return;
      }
      util.showErrorToast("成功");
      this.list();
    })
  },
  // 申请退款调出窗口
  refundCom(orderId) {
    this.showRefundOrderTip = !this.showRefundOrderTip
    this.refundOrderId = orderId
  },
  // 申请退款
  refundOrderTip(orderId, refund) {
    refundOrder(orderId, refund).then(res => {
      if (res.errno !== 0) {
        util.showErrorToast("失败");
        return;
      }
      util.showErrorToast("成功");
      this.list();
    })
  },
  // 确认收货
  confirmOrder(orderId) {
    confirmOrder(orderId).then(res => {
      if (res.errno !== 0) {
        util.showErrorToast("失败");
        return;
      }
      util.showErrorToast("成功");
      this.list()
    })
  },
  toPay(orderId) {
    var that = this;
    prepayOrder(orderId).then(resp => {
      if (resp.errno === 403) {
        util.showErrorToast(resp.errmsg)
      } else {
        WeixinJSBridge.invoke(
          'getBrandWCPayRequest', {
            "appId": resp.data.appId, //公众号名称，由商户传入
            "timeStamp": resp.data.timeStamp, //时间戳，自1970年以来的秒数
            "nonceStr": resp.data.nonceStr, //随机串
            "package": resp.data.packageValue,
            "signType": resp.data.signType, //微信签名方式：
            "paySign": resp.data.paySign //微信签名
          },
          function (res) {
            if (res.err_msg == "get_brand_wcpay_request:ok") {
              that.$router.push('/order/undelivery');
            }
            // 使用以上方式判断前端返回,微信团队郑重提示：res.err_msg将在用户支付成功后返回    ok，但并不保证它绝对可靠。
          }
        );
      }
    })
  },
  rebuy(orderId) {
    rebuy(orderId).then(res => {
      console.info(res)
      if (res.errno !== 0) {
        util.showErrorToast("失败");
        return;
      }
      var arr = [];
      for (var i = 0; i < sessionStorage.length; i++) {
        if (sessionStorage.key(i).substring(0, 7) == "proIds_") {
          arr.push(sessionStorage.key(i));
        }
      }

      for (var i = 0; i < arr.length; i++) {
        sessionStorage.removeItem(arr[i]);
      }

      let currentTime = new Date().getTime();
      sessionStorage.setItem(
        "proIds_" + currentTime,
        JSON.stringify(res.data)
      );
      this.$router.push("/cart?rebuyKey=proIds_" + currentTime);
    })
  },
  getOrderList(page, size) {
    let that = this;
    that.setData({
      loading: true
    })
    util.request(api.getOrderList, {
      page: page,
      size: size,
      showType: that.data.activeTab
    }).then(res => {
      let arr = res.data.orderVoList;
      that.setData({
        totalPage: res.data.totalPages,
        orderList: that.data.orderList.concat(arr),
        loading: false
      })
    }).catch((e) => {
    })
  },
  toggleAlert(e) {
    // e.detail // 自定义组件触发事件时提供的detail对象
    this.setData({
      showAlertTip: !this.data.showAlertTip
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.page >= this.data.totalPage) {
      this.setData({
        loaded: true
      })
      return;
    }
    this.setData({
      page: this.data.page + 1
    })
    this.getOrderList(this.data.page, this.data.size);
  },
  myrefundOrderTip (e) {
    let type = e.detail.type;
    let orderId = e.detail.orderId;
    let refund = e.detail.refund;
    this.setData({
      showRefundOrderTip: false
    })
    if (type === '1') {
      this.refundOrderTip(orderId, refund)
    }
  }
})