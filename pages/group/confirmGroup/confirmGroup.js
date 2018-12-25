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
    suitTypeBox: false,
    maskBoxH: 0,
    region: [],
    provinces: [],
    city: [],
    area: [],
    provincesId: [],
    cityId: [],
    areaId: []
  },
  onLoad: function (options) {
    // wx.removeStorageSync('choosedAddress');
    // wx.setStorageSync('choosedAddress', '{"name": "yuy","mobile": "17611121231","tipText": "北京市 市辖区 东城区","address": "qqqq","provinceId": "1","provinceName": "北京市","cityId": "32","cityName": "北京市","areaId": "376","areaName": "东城区","id": 47}')
    this.setData({
      groupType: Number(options.type),
      groupMyId: Number(options.groupMyId),
      productList: JSON.parse(
        wx.getStorageSync(options.suitKey)
      ),
      groupSuit: JSON.parse(
        wx.getStorageSync(options.groupKey)
      ),
      suitTypes: JSON.parse(
        wx.getStorageSync(options.suitTypeKey)
      ),
      coupon: wx.getStorageSync('choosedCoupon') ? JSON.parse(
        wx.getStorageSync('choosedCoupon')
      ): null,
      choosedAddress: wx.getStorageSync('choosedAddress') ? JSON.parse(
        wx.getStorageSync('choosedAddress')
      ) : null
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
      suitTypes: this.data.suitTypes
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
    this.data.groupMyId ? this.getGroupMyAddress() : null;
    // 运费
    let that = this;
    util.request(api.expressCost + this.data.groupSuit.expressCostId).then(res => {
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
      that.reComputePrice();
    })
  },
  addNumber(e) {
    let number = e.currentTarget.dataset.number;
    let suitNum = e.currentTarget.dataset.suitNum;
    let minimum = this.data.groupSuit.minimum;
    if (number < 0 && suitNum <= minimum) {
      if (minimum > 1) {
        util.showErrorToast('该商品至少购买' + minimum + '份');
      }
      return;
    }
    suitNum = suitNum + number;
    this.setData({
      suitNum: suitNum
    })
    this.reComputePrice();
  },
  reComputePrice() {
    this.setData({
      goodsPrice: 0,
      totalPrice: 0
    })
    let goodsPrice = 0;
    let packPrice = 0;
    // 参团
    if (this.data.groupMy) {
      packPrice = this.data.groupMy.discountPrice;
      goodsPrice = goodsPrice + (this.data.groupMy.discountPrice * this.data.suitNum);
    } else {
      // 开团根据拼团的类型计算不同的套装价格
      let that = this
      if (that.data.groupType === 0) {
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
    wx.setStorageSync('goodsPrice', JSON.stringify(goodsPrice));
    let fare = this.data.expressCostData.expressPrice;
    let expressCostData = this.data.expressCostData;
    if (expressCostData.freeExpress === 1 && goodsPrice >= expressCostData.freeExpressValue) { // 金额包邮
      fare = 0;
    } else if (expressCostData.freeExpress === 2 && this.data.suitNum >= expressCostData.freeExpressValue) { // 数量包邮
      fare = 0;
    }
    this.setData({
      goodsPrice: goodsPrice,
      packPrice: packPrice,
      totalPrice: goodsPrice,
      fare: fare
    })
  },
  checkAddress(address) {
    if (!address.name) {
      util.showErrorToast('请填写收件人姓名')
      return false;
    }
    if (!address.mobile) {
      util.showErrorToast('请填写收货人手机号')
      return false;
    }
    if (address.mobile.length < 11) {
      util.showErrorToast('请填写正确的收货人手机号')
      return false;
    }
    if (!address.tipText) {
      util.showErrorToast('请选择您的所在地区')
      return false;
    }
    if (!address.address) {
      util.showErrorToast('请填写详细地址')
      return false;
    }

    return true;
  },
  submitAddress(e) {
    let address = e.detail.value;
    if (!this.checkAddress(address)) {
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
    console.log(this.data.suitTypes)
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
    this.setData({
      address: {
        tipText: provinces + ' ' + city + ' ' + area
      }
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
      let provincesId = that.returnListName(provinces, 'id');
      // console.log(region[0])
      // console.log(provincesId)
      util.request(api.getRegionsList, {
        pid: provinces[0].id
      }).then((res) => {
        let city = res.data;
        let cityId = that.returnListName(city, 'id');
        region[1] = that.returnListName(city, 'name');
        // console.log(region[1])
        // console.log(cityId)
        util.request(api.getRegionsList, {
          pid: city[0].id
        }).then((res) => {
          let area = res.data;
          let areaId = that.returnListName(area, 'id');
          region[2] = that.returnListName(area, 'name');
          // console.log(region[2])
          // console.log(areaId)
          that.setData({
            region: region,
            provinces: region[0],
            city: region[1],
            area: region[2],
            provincesId: provincesId,
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
    // this.setData({
    //   region: [[],[],[]]
    // })
    switch (e.detail.column) {
      case 0:
        var region = [this.data.provinces, [], []];
        var that = this;
        util.request(api.getRegionsList, {
          pid: this.data.provincesId[e.detail.value]
        }).then((res) => {
          let city = res.data;
          let cityId = [];
          city.forEach(p => {
            region[1].push(p.name);
            cityId.push(p.id);
          })
          util.request(api.getRegionsList, {
            pid: city[0].id
          }).then((res) => {
            let area = res.data;
            area.forEach(p => {
              region[2].push(p.name);
              that.setData({
                cityId: cityId,
                region: region
              })
            })
          })
        })
        break;
      case 1:
        var region = [this.data.provinces, this.data.city, []];
        var that = this;
        // console.log(that.data.cityId);
        // console.log(e.detail.value);
        util.request(api.getRegionsList, {
          pid: that.data.cityId[e.detail.value]
        }).then((res) => {
          let area = res.data;
          area.forEach(p => {
            region[2].push(p.name);
            that.setData({
              region: region
            })
          })
        })
        break;
    }
  }
})