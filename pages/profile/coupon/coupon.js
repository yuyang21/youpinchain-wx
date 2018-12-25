const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    coupons: [], //优惠卷列表,
    goodsPrice: '',
    choosedCoupon: '',
    checked: false,
    confirmOrder: true,
    queryPath: '',
    page: 1,
    size: 10
  },
  onLoad: function (options) {
    if (options.path === 'confirmOrder') {
      this.setData({
        queryPath: options.path,
        goodsPrice: wx.getStorageSync('goodsPrice') ? JSON.parse(wx.getStorageSync('goodsPrice')) : null,
        confirmOrder: true,
        choosedCoupon: wx.getStorageSync('choosedCoupon') ? JSON.parse(wx.getStorageSync('choosedCoupon')) : null
      })
      
    }
  },
  onShow: function () {
    this.couponList(this.data.page, this.data.size);
  },
  couponList (page, size) {
    util.request(api.couponList, {
      page: page,
      size: size
    }).then(res => {
      this.setData({
        coupons: res.data.couponUser
      })
      
    })
  }, 
  selectOrEdit (event) {
    let coupon = event.currentTarget.dataset.coupon;
    if (this.goodsPrice < coupon.money || this.goodsPrice < coupon.condition) {
      this.setData({
        checked: true
      })
      return;
    }
    if (this.data.queryPath === 'confirmOrder') {
      wx.setStorageSync('choosedCoupon', JSON.stringify(coupon));
      wx.navigateBack({
        delta: 1
      })
    }
  },
  nonuse () {
    if (this.data.checked) {
      wx.setStorageSync('choosedCoupon', '');
      this.setData({
        choosedCoupon: ''
      })
    }
  }
})