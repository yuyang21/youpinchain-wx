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
    isAloneBuy: false,
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
    suitTypeBox: false,
    maskBoxH: 0,
    region: [],
    provinces: [],
    city: [],
    area: [],
    provincesId: [],
    cityId: [],
    areaId: [],
    isAddress: true,
    groupSuitId: 0
  },
  onLoad: function (options) {
    this.setData({
      isAloneBuy: options.isAloneBuy === 'true',
      groupMyId: parseInt(options.groupMyId),
      productList: JSON.parse(
        wx.getStorageSync(options.suitKey)
      ),
      groupSuit: JSON.parse(
        wx.getStorageSync(options.groupKey)
      ),
      suitTypes: JSON.parse(
        wx.getStorageSync(options.suitTypeKey)
      ),
      
    })
    this.setData({
      groupSuitId: this.data.groupSuit.id
    })
    this.data.suitTypes.forEach(t => {
      if (t.type === 1) {
        t.textType = '普通拼团';
      } else if (t.type === 2) {
        t.textType = '同一地址拼团';
      }
      if (t.type === this.data.groupSuitType && this.data.groupSuit.id === t.productId) {
        this.setData({
          packPrice: t.discountPrice
        })
      }
    });
  },
  onShow: function () {
    this.setData({
      suitTypes: this.data.suitTypes,
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
      suitNum: this.data.groupSuit.minimum,
      showTotal: this.data.productList.length > 2
    })
    // 运费
    let that = this;
    util.request(api.expressCost + that.data.groupSuit.expressCostId).then(res => {
      let expressCostData = res.data;
      let fareInfo = '';
      if (expressCostData.freeExpress === 1) {
        fareInfo = '(满' + expressCostData.freeExpressValue + '元包邮)'
      } else if (expressCostData.freeExpress === 2) {
        fareInfo = '(满' + expressCostData.freeExpressValue + '件包邮)'
      }
      that.setData({
        expressCostData: expressCostData,
        fareInfo: fareInfo
      })
      that.data.groupMyId ? that.getGroupMyAddress() : that.reComputePrice();
    })
    util.request(api.getAddressByGroupSuit + that.data.groupSuit.id).then(res => {
      let addressList = res.data;
      let isAddress = true;
      addressList.forEach(a => {
        if (a.id === this.data.choosedAddress.id){
          isAddress = false;
        }
      })
      that.setData({
        isAddress: isAddress
      })
    })
  },
  paymentCall() {
    // 自定义购买商品判断
    if (this.data.groupSuit.type === 2 && this.data.buyNum <= 0) {
      util.showErrorToast('请至少选择一件商品！')
      return
    }
    let that = this;
    if (!that.data.groupSuitType) {
      that.setData({
        suitTypeBox: true
      })
      that.showTipsBox();
      return;
    }
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
      if (!that.checkAddress(that.data.address)) {
        that.setData({
          payButton: false
        })
        return;
      }
    } else {
      that.doPayCall();
    }
  },
  doPayCall() {
    let that = this;
    let suitId = that.data.groupSuit.id;
    let addressId = that.data.choosedAddress.id;
    let isAloneBuy = Boolean(that.data.isAloneBuy);
    let groupSuitType = that.data.groupSuitType;
    let suitNum = that.data.suitNum;
    let groupMyId = !that.data.groupMyId ? null : Number(that.data.groupMyId);
    let products = that.data.productList;

    // 开团
    if (!groupMyId) {
      util.request('/groups/' + suitId + '/groupMys', {
        suitId: suitId,
        isAloneBuy: isAloneBuy,
        groupSuitType: groupSuitType,
        suitNum: suitNum,
        groupMyId: groupMyId
      }, 'POST').then((res) => {
        // 开团失败时
        if (res.errno !== 0) {
          util.showErrorToast(res.errmsg);
          return;
        }
        groupMyId = res.data;
        that.submitGroup(suitId, addressId, that.couponId, that.message, suitNum, groupMyId, products);
      })
    } else { // 参团
      that.submitGroup(suitId, addressId, that.couponId, that.message, suitNum, groupMyId, products);
    }
  },
  submitGroup(suitId, addressId, couponId, message, suitNum, groupMyId, products) {
    let that = this;
    util.request('/groups/' + suitId + '/groupMys/' + groupMyId + '/order', {
      suitId: suitId,
      addressId: addressId,
      couponId: couponId,
      message: message,
      suitNum: suitNum,
      groupMyId: groupMyId,
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
    util.request('/orders/' + orderId + '/prepay', {}, 'POST').then(resp => {
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      that.setData({
        payButton: false
      })
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
              wx.navigateTo({
                url: '../groupMy/groupMy?groupMyId' + groupMyId
              })
            } else {
              wx.navigateTo({
                url: '../../order/list/list'
              })
            }
          },
          fail(res) {
            util.showErrorToast('支付失败');
          }
        })
      }
    })
  },
  addNumber(e) {
    let number = e.currentTarget.dataset.number;
    let suitNum = e.currentTarget.dataset.suitNum;
    let minimum = this.data.groupSuit.minimum;
    if (number < 0 && suitNum <= minimum) {
      if (minimum > 1) {
        util.showErrorToast('至少购买' + minimum + '份');
      }
      return;
    }
    this.setData({
      suitNum: suitNum + number
    })
    this.reComputePrice();
  },
  addProNum(e) {
    let productId = e.currentTarget.dataset.productId;
    let number = parseInt(e.currentTarget.dataset.number);
    let that = this
    let productList = that.data.productList;
    productList.forEach(item =>{
      if(item.productId === productId){
        if (item.buyNum <= (item.minimum ? item.minimum : 0) && number <= 0) {
          if (item.minimum > 0) {
            util.showErrorToast('至少购买' + item.minimum + '份');
          }
          return
        }
        item.buyNum = item.buyNum + number
      }
    })
    that.setData({
      productList: productList
    })
    that.reComputePrice();
  },
  reComputePrice() {
    this.setData({
      goodsPrice: 0,
      totalPrice: 0
    })
    let goodsPrice = 0;
    let packPrice = 0;
    let buyNum = 0
    if (this.data.groupSuit.type === 1) {
      // 参团
      if (this.data.groupMy) {
        packPrice = this.data.groupMy.discountPrice;
        goodsPrice = goodsPrice + (this.data.groupMy.discountPrice * this.data.suitNum);
      } else {
        // 开团根据拼团的类型计算不同的套装价格
        let that = this
        if (that.data.isAloneBuy) {
          packPrice = that.data.groupSuit.suitPrice;
          goodsPrice = goodsPrice + (that.data.groupSuit.suitPrice * that.data.suitNum);
        } else {
          that.data.suitTypes.forEach(suitType => {
            if (suitType.type === that.data.groupSuitType) {
              if (that.data.groupSuit.id === suitType.productId) {
                packPrice = suitType.discountPrice;
                goodsPrice = goodsPrice + (suitType.discountPrice * that.data.suitNum);
              }
            }
          })
        }
      }
    } else if (this.data.groupSuit.type === 2) { // 自定义拼团
      this.setData({
        buyNum: 0
      })
      let that = this
      // 单独购买
      if (that.data.isAloneBuy) {
        that.data.productList.forEach(pro => {
          pro.groupProductPrice.forEach(productPrice => {
            if (productPrice.buyType === 1) {
              pro.realProductPrice = productPrice.presentPrice;
              goodsPrice = goodsPrice + pro.buyNum * productPrice.presentPrice;
              buyNum = buyNum + pro.buyNum;
            }
          })
        })
      } else {
        // 参团
        if (that.data.groupMy) {
          that.setData({
            groupSuitType: that.data.groupMy.groupSuitType
          })
        }
        // 根据拼团的类型计算不同的套装价格
        if (that.data.groupSuitType === 1) { //普通拼团，不同地址
          that.data.productList.forEach(pro => {
            pro.groupProductPrice.forEach(productPrice => {
              if (productPrice.buyType === 2) {
                pro.realProductPrice = productPrice.presentPrice;
                goodsPrice = goodsPrice + pro.buyNum * productPrice.presentPrice;
                buyNum = buyNum + pro.buyNum;
              }
            })
          })
        } else { // 同一地址拼团
          that.data.productList.forEach(pro => {
            pro.groupProductPrice.forEach(productPrice => {
              if (productPrice.buyType === 3) {
                pro.realProductPrice = productPrice.presentPrice;
                goodsPrice = goodsPrice + pro.buyNum * productPrice.presentPrice;
                buyNum = buyNum + pro.buyNum;
              }
            })
          })
        }
      }
    }
    if (this.data.groupSuit.type === 2) {
        buyNum = buyNum;
    } else {
        buyNum = this.data.suitNum
    }
    wx.setStorageSync('goodsPrice', JSON.stringify(goodsPrice));
    let expressCostData = this.data.expressCostData;
    let fare = expressCostData.expressPrice;
    if (expressCostData.freeExpress === 1 && goodsPrice >= expressCostData.freeExpressValue) { // 金额包邮
      fare = 0;
    } else if (expressCostData.freeExpress === 2 && buyNum >= expressCostData.freeExpressValue) { // 数量包邮
      fare = 0;
    }
    this.setData({
      goodsPrice: goodsPrice.toFixed(2),
      packPrice: packPrice.toFixed(2),
      totalPrice: goodsPrice.toFixed(2),
      fare: fare.toFixed(2),
      buyNum: buyNum
    })
  },
  submitAddress(e) {
    // let address = e.detail.value;
    let address = e.currentTarget.dataset.address;
    console.log(address)
    if (!util.checkAddress(address)) {
      return;
    }
    util.request(api.addAddress, {
      name: address.name,
      provinceId: this.data.provincesId,
      cityId: this.data.cityId,
      areaId: this.data.areaId,
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
  getGroupMyAddress() {
    var that = this
    util.request('/groups/' + that.data.groupSuit.id + '/groupMys/' + that.data.groupMyId).then((res) => {
      that.setData({
        groupMy: res.data.groupMy,
        tuanAddress: res.data.orderAddressVo,
        groupSuitType: res.data.groupMy.groupSuitType,
        packPrice: res.data.groupMy.discountPrice
      })
      that.reComputePrice();
    })
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
    this.reComputePrice();
  },
  changeRegin (e) {
    let arr = e.detail.value;
    let provinces = this.data.region[0][arr[0]];
    let city = this.data.region[1][arr[1]];
    let area = this.data.region[2][arr[2]];
    let address = this.data.address;
    address.tipText = provinces + ' ' + city + ' ' + area;
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
          pid: this.data.provincesId[e.detail.value]
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
          pid: that.data.cityId[e.detail.value]
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