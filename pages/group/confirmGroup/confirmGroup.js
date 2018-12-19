const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    showTotal: false,
    totalPrice: 0,
    goodsPrice: 0,
    packPrice: 0,
    packingFee: 0,
    packingFeeReduction: 0,
    fare: 0,
    fareInfo: '',
    productList: [],
    groupSuit: {},
    butpart: false, //  新增地址按钮的透明度
    choosedAddress: undefined,
    address: {
      name: '', // 姓名
      mobile: '', // 手机号
      tipText: '', // 送餐地址
      address: '', // 地址
    },
    orderId: 0,
    message: '',
    groupType: '',
    groupMyId: null,
    groupMy: null,
    payButton: false,
    coupon: '',
    couponId: '',
    suitNum: 1,
    showTip: false,
    groupSuitType: 2,
    suitTypes: [],
    tuanAddress: {},
    expressCostData: null,
    showLoading: false,
    suitTypeBox: false
  },
  onLoad: function (options) {
    this.setData({
      groupType: Number(options.type),
      groupMyId: options.groupMyId,
      suitKey: options.suitKey,
      groupKey: options.groupKey,
      suitTypeKey: options.suitTypeKey
    })
  },
  onShow: function () {
    this.setData({
      productList: JSON.parse(
        wx.getStorageSync(this.data.suitKey)
      ),
      groupSuit: JSON.parse(
        wx.getStorageSync(this.data.groupKey)
      ),
      suitTypes: JSON.parse(
        wx.getStorageSync(this.data.suitTypeKey)
      ),
      coupon: JSON.parse(
        wx.getStorageSync('choosedCoupon')
      )
    })

    this.data.suitTypes.forEach(t => {
      if (t.type === 1) {
        t.text = '普通拼团';
      } else if (t.type === 2) {
        t.text = '同一地址拼团';
      }
      if (t.type === this.data.groupSuitType && this.data.groupSuit.id === t.productId) {
        this.setData({
          packPrice: t.discountPrice
        })
      }

    });

    if (wx.getStorageSync('choosedAddress') != 'undefined') {
      this.setData({
        choosedAddress: JSON.parse(
          wx.getStorageSync('choosedAddress')
        )
      })
    }
    if (!this.data.choosedAddress) {
      // this.setRegions();
      this.getDefaultAddress();
    }
    if (this.data.coupon) {
      this.setData({
        totalPrice: this.data.totalPrice - this.data.coupon.money,
        couponId: this.data.coupon.id
      })
    }
  },
  getDefaultAddress () {
    let that = this;
    util.request(api.getDefaultAddress).then((res) => {
      if (res.errno == 0 && res.data) {
        let address = res.data;
        that.setData({
          choosedAddress: address
        })
        wx.setStorageSync('choosedAddress', JSON.stringify(address));
      } else {
        util.request(api.getAddressList, {page: 1, pageSize: 1}).then(res => {
          if (res.errno == 0 && res.data.length > 0) {
            that.setData({
              choosedAddress: res.data[0]
            })
            wx.setStorageSync('choosedAddress', JSON.stringify(that.data.choosedAddress));
          }
        })
      }
    })
  }
})