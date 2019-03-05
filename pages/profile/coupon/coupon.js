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
        goodsPrice: wx.getStorageSync('goodsPrice') ? JSON.parse(wx.getStorageSync('goodsPrice')) : null,
        confirmOrder: true
      })
    }
    this.setData({
      queryPath: options.path ? options.path : '',
      choosedCoupon: wx.getStorageSync('choosedCoupon') ? JSON.parse(wx.getStorageSync('choosedCoupon')) : null,
      cartCoupon: wx.getStorageSync('cartCoupon') ? JSON.parse(wx.getStorageSync('cartCoupon')) : null
    })
  },
  onShow: function () {
    this.setData({
      noCoupon: this.data.choosedCoupon === -1 ? true : false
    })
    this.couponList(this.data.page, this.data.size);
  },
  couponList (page, size) {
    util.request(api.couponList, {
      page: page,
      size: size
    }).then(res => {
      let coupons = res.data;
      coupons.forEach(c => {
        c.choose = false;
        c.unavailable = false;
        if (this.data.choosedCoupon && this.data.choosedCoupon != -1) {
          if (c.coupon.id === this.data.choosedCoupon.coupon.id) {
            c.choose = true;
          }
        }
        if (this.data.queryPath === 'cart') {
          c.unavailable = true;
          switch (c.coupon.useType) {
            case 0: 
              if (c.coupon.minPoint === 0 || c.coupon.minPoint <= this.data.cartCoupon.totalPrice) {
                c.unavailable = false;
              } else {
                c.unavailable = true;
              }
              break;
            case 1:
              let list = c.couponProductCategoryRelations;
              let cartGoodsPrice = 0;
              if (list.length > 0) {
                list.forEach(l => {
                  if (c.unavailable) {
                    this.data.cartCoupon.carts.forEach(o => {
                      if (l.productCategoryId === o.categoryId) {
                        cartGoodsPrice += (o.presentPrice * o.number);
                        if (c.coupon.minPoint === 0 || c.coupon.minPoint <= cartGoodsPrice) {
                          c.unavailable = false;
                        } else {
                          c.unavailable = true;
                        }
                      }
                    })
                  }
                })
              }
              break;
            case 2: // 指定商品
              let arr = c.couponProductRelations;
              let itemGoodsPrice = 0;
              if (arr.length > 0) {
                arr.forEach(a => {
                  if (c.unavailable) {
                    this.data.cartCoupon.carts.forEach(o => {
                      if (a.productId === o.productId) {
                        itemGoodsPrice += (o.presentPrice * o.number);
                        if (c.coupon.minPoint === 0 || c.coupon.minPoint <= itemGoodsPrice) {
                          c.unavailable = false;
                        } else {
                          c.unavailable = true;
                        }
                      }
                      // if (a.productId === o.productId && (c.coupon.minPoint === 0 || c.coupon.minPoint <= this.data.cartCoupon.totalPrice)) {
                      //   c.unavailable = false;
                      // } else {
                      //   c.unavailable = true;
                      // }
                    })
                  }
                })
              }
              break;
            default: 
              c.unavailable = false;
          }
        }
      })
      this.setData({
        coupons: coupons
      })
      
    })
  }, 
  selectCoupon (event) {
    let coupon = event.currentTarget.dataset.coupon;
    if (coupon.unavailable) {
      return;
    }
    this.setData({
      noCoupon: false
    })
    let couponIndex = event.currentTarget.dataset.couponIndex;
    let coupons = this.data.coupons;
    coupons[couponIndex].choose = true;
    this.setData({
      coupons: coupons
    })
    if (this.data.queryPath === 'cart') {
      setTimeout(function (){
        wx.setStorageSync('choosedCoupon', JSON.stringify(coupon));
        wx.navigateBack({
          delta: 1
        })
      }, 200)
    }
  },
  nonuse () {
    wx.setStorageSync('choosedCoupon', -1);
    this.setData({
      choosedCoupon: '',
      noCoupon: true
    })
    if (this.data.queryPath === 'cart') {
      setTimeout(function (){
        wx.navigateBack({
          delta: 1
        })
      }, 200)
    }
  }
})