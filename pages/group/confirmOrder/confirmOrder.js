const util = require('../../../utils/util');
const api = require('../../../config/api');
var commonMixin = require('../../../mixins/commonMixin');
Page(Object.assign({
  data: {
    groupSuitType: 2,
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
    areaId: [],
    suitTypeBox: false,
    showTip: false,
    maskBoxH: 0,
    isAloneBuy: false,
    groupMy: undefined
  },
  onLoad: function (options) {
    this.setData({
      products: JSON.parse(
        wx.getStorageSync('cartsKey')
      ),
      isAloneBuy: options.isAloneBuy === 'true',
      groupMyId: options.groupMyId ? parseInt(options.groupMyId): null,
      expressCostId: options.expressCostId
    });
    if (this.data.groupMyId != null) {
      let that = this;
      util.request('/groupMy/' + this.data.groupMyId, {}).then(res => {
        if (res.errno === 0 ) {
            this.setData({
                groupMy: res.data
            })
        }
      })
    }
  },
  onUnload: function () {
    wx.removeStorageSync('cartsKey');
  },
  onShow: function () {
    this.setData({
      choosedAddress: wx.getStorageSync('choosedAddress') ? JSON.parse(
        wx.getStorageSync('choosedAddress')
      ) : null
    })
    if (!this.data.choosedAddress) {
      this.setRegions(0, 0);
      this.getDefaultAddress();
    }
    let product = this.data.products.data;
    this.setData({
      goodsPrice: product.number * product.minPrice
    })
    this.data.isAloneBuy? '' : this.getGroupSuitType();
    this.data.expressCostId ? this.expressCost() : null;
  },
  expressCost () {
    // 运费
    let that = this;
    util.request(api.expressCost + that.data.expressCostId).then(res => {
      let expressCostData = res.data;
      let fareInfo = '';
      if (expressCostData.freeExpress === 1) {
        fareInfo = '(满' + expressCostData.freeExpressValue + '元包邮)'
      } else if (expressCostData.freeExpress === 2) {
        fareInfo = '(满' + expressCostData.freeExpressValue + '件包邮)'
      }
      let fare = expressCostData.expressPrice;
      if (expressCostData.freeExpress === 1 && that.data.goodsPrice >= expressCostData.freeExpressValue) { // 金额包邮
        fare = 0;
      } else if (expressCostData.freeExpress === 2 && that.data.products.data.number >= expressCostData.freeExpressValue) { // 数量包邮
        fare = 0;
      }
      that.setData({
        fareInfo: fareInfo,
        fare: fare
      })
      // that.data.groupMyId ? that.getGroupMyAddress() : null;
    })
  },
  getGroupSuitType () {
    util.request('/products/' + this.data.products.data.id + '/groupSuitType').then(res => {
      if (res.errno !== 0) {
        util.showErrorToast(res.errMsg);
        return;
      }
      let suitTypes = res.data;
      suitTypes.forEach(t => {
        if (t.type === 1) {
          t.textType = '不同地址拼团';
        } else if (t.type === 2) {
          t.textType = '同一地址拼团';
        }
        this.setData({
          suitTypes: suitTypes
        })
      })
      if (suitTypes.length === 1){
        this.setData({
          groupSuitType: suitTypes[0].type
        })
      }
    })
  },
  showTipsBox (event) {
    if (event.currentTarget.dataset.close) {
      this.setData({
        suitTypeBox: false,
        showTip: false
      })
      return;
    }
    if (event.currentTarget.dataset.type) {
      this.setData({
        suitTypeBox: true
      })
    }
    if (this.data.suitTypeBox && this.data.showTip) {
      return
    }
    this.setData({
      showTip: !this.data.showTip,
      maskBoxH: wx.getSystemInfoSync().windowHeight
    })
  },
  selectSuitType (event) {
    this.setData({
      groupSuitType: event.currentTarget.dataset.suitType
    })
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
    if (this.data.orderId !== 0) {
      this.doPay(this.data.orderId);
      return;
    }
    let addressId = this.data.choosedAddress.id;
    let groupMyId = !this.data.groupMyId ? null : Number(this.data.groupMyId);
    if (this.data.isAloneBuy) {
      this.aloneOrder(this.data.products.cartIds, addressId);
    } else {
      // 开团
      if (!groupMyId) {
        util.request('/groupMy/2/' + this.data.products.data.id, {
          groupSuitType: 1,
          sku: this.data.products.sku.skuCode
        }, 'POST').then((res) => {
          // 开团失败时
          if (res.errno !== 0) {
            util.showErrorToast(res.errmsg);
            return;
          }
          groupMyId = res.data;
          this.submitGroup(groupMyId, addressId);
        })
      } else { // 参团
        this.submitGroup(groupMyId, addressId);
      }
    }
  },
  aloneOrder (cartIds, addressId) {
    let that = this;
    util.request(api.submitOrder, {
      cartIds: cartIds,
      addressId: addressId,
      couponId: that.data.couponId,
      message: that.data.message
    }, 'POST').then(res => {
      that.setData({
        orderId: res.orderId
      })
      that.doPay(this.data.orderId);
    })
  },
  submitGroup (groupMyId, addressId) {
    let that = this;
    let products = [{
      productId: this.data.products.data.id,
      buyNum: this.data.products.data.number,
      skuCode: that.data.products.sku.skuCode
    }]
    util.request('/order/1', {
      productType: 2,
      groupSuitType: 1,
      groupMyId: groupMyId,
      addressId: addressId,
      products: products
    }, 'POST').then(res => {
      if (res.errno !== 0) {
        util.showErrorToast(res.errmsg);
        that.setData({
          payButton: false
        })
        return;
      }
      that.setData({
        orderId: res.data
      })
      that.doPay(that.data.orderId, groupMyId);
    })
  },
  doPay(orderId, groupMyId) {
    let that = this;
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('/orders/' + orderId + '/prepay', {
      type: '1111111111'
    }, 'POST').then(resp => {
      that.setData({
        payButton: false
      })
      wx.hideLoading();
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
            if (!that.data.isAloneBuy) {
              // wx.navigateTo({
              //   url: '../groupMy/groupMy?groupMyId' + groupMyId
              // })

              // 拼团成功，跳转到待发货
              if (that.data.groupMyId) {
                  util.request(api.groupMy + '/' + that.data.groupMyId, {

                  }, "GET").then(res => {
                    if (res.errno === 0 && res.data.joinNum + 1 >= res.data.rulesNum) {
                        wx.redirectTo({
                            url: '../../order/list/list?showType=201'
                        })
                    } else {
                        wx.redirectTo({
                            url: '../../order/list/list?showType=200'
                        })
                    }
                  });

              // 拼团未成功，跳转到待分享，引导用户分享
              } else {
                  wx.redirectTo({
                      url: '../../order/list/list?showType=200'
                  })
              }

            } else {
              wx.redirectTo({
                url: '../../order/list/list'
              })
            }
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
              areaId: area[0].id,
              areaIds: that.returnListName(area, 'id'),
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
