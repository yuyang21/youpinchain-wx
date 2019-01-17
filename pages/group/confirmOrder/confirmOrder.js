const util = require('../../../utils/util');
const api = require('../../../config/api');
var commonMixin = require('../../../mixins/commonMixin');
Page(Object.assign({
  data: {
    showTotal: false,
    totalPrice: 0,
    goodsPrice: 0,
    packPrice: 0,
    packingFee: 0,
    packingFeeReduction: 0,
    fare: 0,
    productList: [],
    payment: 0,
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
    coupon: '',
    couponId: '',
    region: [],
    provinces: [],
    city: [],
    area: [],
    provinceId: [],
    cityId: [],
    areaId: []
  },
  onLoad: function (options) {
    this.setData({
        brandCartList: JSON.parse(
            wx.getStorageSync(options.cartsKey)
        )
    })
  },
  onShow: function () {
    this.setData({
      coupon: wx.getStorageSync('choosedCoupon') ? JSON.parse(
        wx.getStorageSync('choosedCoupon')
      ) : null,
      choosedAddress: wx.getStorageSync('choosedAddress') ? JSON.parse(
        wx.getStorageSync('choosedAddress')
      ) : null
    })
    if (!this.data.choosedAddress) {
      this.setRegions(0, 0);
      this.getDefaultAddress();
    }
    if (this.data.coupon) {
      this.setData({
        totalPrice: this.data.totalPrice - this.data.coupon.money,
        couponId: this.data.coupon.id
      })
    }

    // 最低起售份数
    this.setData({
        productList: [],
        showTotal: this.data.brandCartList.length > 2
    })
    let brandCartList = this.data.brandCartList;
    let productList = this.data.productList;
    let goodsPrice = 0;
    let payment = 0;
    let fare = 0;
    brandCartList.forEach(cart => {
        let brandNum = 0;
        let brandPrice = 0;
        cart.cartListDtos.forEach(cartItem => {
            let itemGoodsPrice = cartItem.presentPrice * cartItem.number;
            goodsPrice += itemGoodsPrice;
            payment += itemGoodsPrice;
            brandNum += cartItem.number;
            brandPrice += itemGoodsPrice;
            productList.push(cartItem)
        })

        if (cart.expressCost && cart.expressCost.freeExpress === 1 && brandPrice < cart.expressCost.freeExpressValue) { // 下单金额
            fare += cart.expressCost.expressPrice;
        }
        if (cart.expressCost && cart.expressCost.freeExpress === 2 && brandNum < cart.expressCost.freeExpressValue) { // 下单金额
            fare += cart.expressCost.expressPrice;
        }
    });
    this.setData({
        productList: productList,
        totalPrice: fare + payment,
        goodsPrice: goodsPrice,
        payment: payment,
        fare: fare
    })
    wx.setStorageSync('goodsPrice', JSON.stringify(goodsPrice));
  },
  paymentCall() {
    let that = this;
    if (that.data.payButton) {
      return;
    }
    that.setData({
      payButton: true
    })
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    setTimeout(function () {
      wx.hideLoading();
    }, 3000);
    if (!that.data.choosedAddress) {
        if (!util.checkAddress(that.data.address)) {
            that.setData({
                payButton: false
            })
            return;
        }
        that.submitAddress(that.data.address, function () {
            that.doPayCall();
        })
    } else {
        that.doPayCall();
    }
  },
  doPayCall() {
    if (this.data.orderId != 0) {
        this.doPay(this.data.orderId);
        return;
    }

    let cartIds = [];
    this.data.productList.forEach(cart => {
        cartIds.push(cart.cartId);
    });
    let addressId = this.data.choosedAddress.id;
    let that = this;
    util.request(api.submitOrder, {
        cartIds: cartIds,
        addressId: addressId,
        couponId: that.data.couponId, 
        message: that.data.message
    }, 'POST').then(res => {
        if (res.errno !== 0) {
            util.showErrorToast(res.errmsg);
            return;
        }
        that.setData({
            orderId: res.data
        })
        that.doPay(that.data.orderId);
    })
  },
  doPay(orderId) {
    let that = this;
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('/orders/' + orderId + '/prepay', {}, 'POST').then(resp => {
      that.setData({
        payButton: false
      })
      wx.hideLoading();
      console.log(resp.errno);
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
            that.setData({
              payButton: false
            })
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
  submitAddress(e) {
    // let address = e.detail.value;
    let address = Object.assign(e.currentTarget.dataset.address, this.data.address);
    if (!util.checkAddress(address)) {
      return;
    }
    util.request(api.addAddress, {
      name: address.name,
      provinceId: address.provinceId,
      cityId: address.cityId,
      areaId: address.areaId,
      mobile: address.mobile,
      address: address.address
    }, 'POST').then(res => {
      address.id = res.data;
      if (res.errno == 0) {
        wx.setStorageSync('choosedAddress', JSON.stringify(address));
        this.setData({
          choosedAddress: JSON.parse(wx.getStorageSync('choosedAddress'))
        })
      }
    });
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
  },
  changeRegin (e) {
    let arr = e.detail.value;
    let address = this.data.address;
    address.provinceId = this.data.provinceId;
    address.cityId = this.data.cityId;
    address.areaId = this.data.areaId;
    address.provinceName = this.data.region[0][arr[0]];
    address.cityName = this.data.region[1][arr[1]];
    address.areaName = this.data.region[2][arr[2]];
    address.tipText = address.provinceName + ' ' + address.cityName + ' ' + address.areaName;
    this.setData({
      address: address
    });
  },
  returnListName(list, type) {
    let arr = [];
    list.forEach(t => {
      arr.push(t[type])
    })
    return arr;
  },
  setRegions(pid) {
    let that = this;
    var region = [[],[],[]];
    util.request(api.getRegionsList, {
      pid: pid
    }).then((res) => {
      let provinces = res.data;
      region[0] = that.returnListName(provinces, 'name');
      let provinceId = provinces[0].id;
      util.request(api.getRegionsList, {
        pid: provinceId
      }).then((res) => {
        let city = res.data;
        let cityId = city[0].id;
        region[1] = that.returnListName(city, 'name');
        util.request(api.getRegionsList, {
          pid: cityId
        }).then((res) => {
          let area = res.data;
          let areaId = area[0].id;
          region[2] = that.returnListName(area, 'name');
          that.setData({
            region: region,
            provinces: region[0],
            city: region[1],
            area: region[2],
            provinceIds: that.returnListName(provinces, 'id'),
            cityIds: that.returnListName(city, 'id'),
            areaIds: that.returnListName(area, 'id'),
            provinceId: provinceId,
            cityId: cityId,
            areaId: areaId
          })
        })
      })
      // console.log(that.data.region)
    })
  },
  bindMultiPickerColumnChange (e) {
    // console.log('修改的列为', e.detail.column, '，值为', e.detail.value)
    switch (e.detail.column) {
      case 0:
        var region = [this.data.provinces, [], []];
        var that = this;
        util.request(api.getRegionsList, {
          pid: this.data.provinceIds[e.detail.value]
        }).then((res) => {
          let city = res.data;
          let cityIds = [];
          city.forEach(p => {
            region[1].push(p.name);
            cityIds.push(p.id);
          })
          util.request(api.getRegionsList, {
            pid: city[0].id
          }).then((res) => {
            let area = res.data;
            area.forEach(p => {
              region[2].push(p.name);
              that.setData({
                cityIds: cityIds,
                region: region,
                provinceId: this.data.provinceIds[e.detail.value],
                cityId: city[0].id,
                areaId: area[0].id
              })
            })
          })
        })
        break;
      case 1:
        var region = [this.data.provinces, this.data.city, []];
        var that = this;
        util.request(api.getRegionsList, {
          pid: that.data.cityIds[e.detail.value]
        }).then((res) => {
          let area = res.data;
          area.forEach(p => {
            region[2].push(p.name);
            that.setData({
              region: region,
              cityId: that.data.cityIds[e.detail.value],
              areaId: area[0].id
            })
          })
        })
        break;
      case 2:
        this.setData({
          areaId: this.data.areaIds[e.detail.value]
        })
        break;
    }
  }
}, commonMixin))