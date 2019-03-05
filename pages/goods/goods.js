const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp();
Page({
  data: {
    groupSuitId: null,
    showShare: false,
    brands: "",
    reportList: [],
    groupMyId: null,
    groupMy: {},
    suitTypes: [],
    cart_num: 0,
    endTimeDown: 0,
    startTimeDown: 0,
    headPic: [],
    footPic: [],
    standardBox: false,
    standards: [],
    standardIndex: 0,
    mask_box_H: wx.getSystemInfoSync().windowHeight,
    btnType: String,
    sku: {},
    buyNum: 1,
    cartNum: 0,
    showPoster: false,
    canOpenGroup: false,
    spellList: [],
    isScroll: true,
    isLoaded: true
  },
  onLoad: function (options) {
    util.dealwithInviter(options);
    var scene = {};
    if (options.scene) {
      var params = decodeURIComponent(options.scene).split(",");
      params.forEach(p => {
        scene[p.split("=")[0]] = p.split("=")[1];
        console.log('scene.' + p.split("=")[0] + ':' + p.split("=")[1])
      });
    }
    this.setData({
      productId: options.productId || scene.P,
      brandId: options.brandId || scene.B,
      groupMyId: options.groupMyId || scene.G || null,
      mask_box_H: wx.getSystemInfoSync().windowHeight
    });
    console.log('options.groupMyId: ' + options.groupMyId)
    if (this.data.groupMyId != null) {
      let that = this;
      util.request('/groupMy/' + this.data.groupMyId, {}).then(res => {

          if (res.errno === 0 && (res.data == null || res.data.groupStatus !== 1)) {
              util.showErrorToast('该拼团已满！')

              that.setData({
                  groupMyId: null
              })
          }
      })
    }
  },
  onShareAppMessage: function (option) {
    let that = this;
    let obj = {
      title: '超值拼团 ' + that.data.goods.name,
      path: that.route,
      imageUrl: that.data.goods.thumbnailPic
    };
    return util.shareEvent(option, obj);
  },
  onShow: function () {
    this.initData();
    this.getstandards();
    this.getBrands();
    this.getGroupMys();
    app.findCart();
    this.setData({
      cartNum: app.globalData.cartNum,
      isLoaded: true
    })
  },
  onPageScroll: function (e) {
  },
  getGroupMys () {
    let that = this;
    util.request('/groupMy', {
      productOrSuitId: that.data.productId,
      productType: 2
    }).then(res => {
      that.setData({
        spellList: res.data
      });
      if (res.data.length > 0) {
        res.data.forEach(o => {
          o.endTimeDown = o.countDown / 1000;
        });
        that.setData({
          spellList: res.data
        });
        that.countDown();
      }
    })
  },
  countDown () {
    let that = this;
    let spellList = that.data.spellList;
    var time = setTimeout(function () {
      if (!that.data.isLoaded) {
        clearTimeout(time);
        return;
      }
      spellList.forEach(o => {
        if (o.endTimeDown <= 0) {
          clearTimeout(time)
          return;
        }
        o.endTimeDown = o.endTimeDown - 1
      })
      that.setData({
        spellList: spellList
      })
      that.countDown();
    }, 1000)
  },
  spelling (e) {
    let groupMyId = e.currentTarget.dataset.groupMyId;
    this.setData({
      groupMyId: groupMyId,
      spelldBox: false
    })
    this.showCartMask();
  },
  getBrands () {
    util.request('/brands/' + this.data.brandId + '/info').then(res => {
      this.setData({
        brands: res.data
      })
    })
    util.request('/products/' + this.data.productId + '/report').then(res => {
      let reportList = res.data;
      reportList.forEach(b => {
        b.icon = JSON.parse(b.value).icon
      });
      this.setData({
        reportList: reportList
      })
    })
  },
  getGroupSuitType () {
    util.request('/products/' + this.data.productId + '/groupSuitType').then(res => {
      if (res.errno !== 0) {
        // util.showErrorToast(res.errMsg);
        return;
      }
      let suitTypes = res.data;
      if (suitTypes.length > 0) {
        this.setData({
          suitTypes: suitTypes
        })
        this.canGroup();
      }
    })
  },
  canGroup () {
    let skuCodes = [];
    let minPrice = 9999999999990;
    this.data.suitTypes.forEach(s => {
      skuCodes.push(s.skuCode);
      if (s.skuCode === this.data.standards[this.data.standardIndex].skuCode) {
        minPrice = minPrice > s.discountPrice ? s.discountPrice : minPrice;
      }
    })
    if (this.data.btnType === 'cart') {
      this.setData({
        minPrice: this.data.standards[this.data.standardIndex].promotionPrice
      })
    }
    if (skuCodes.indexOf(this.data.standards[this.data.standardIndex].skuCode) !== -1) {
      let goods = this.data.goods;
      goods.originalPrice = this.data.standards[this.data.standardIndex].price;
      this.setData({
        canOpenGroup: true,
        groupPrice: minPrice,
        goods: goods
      })
    } else {
      this.setData({
        canOpenGroup: false
      })
    }
  },
  getstandards () {
    let that = this;
    util.request('/products/' + that.data.productId + '/sku').then(res => {
      that.setData({
        standards: res.data
      })
      that.getGroupSuitType();
    })
  },
  showspellMask () {
    this.setData({
      spelldBox: true,
      isScroll: false
    })
  },
  closespellMask () {
    this.setData({
      spelldBox: false,
      isScroll: true,
      groupMyId: null
    })
  },
  showCartMask (e) {
    let btnType = e ? e.currentTarget.dataset.btnType : null;
    this.setData({
      standardBox: !this.data.standardBox,
      btnType: btnType,
      sku: this.data.standardIndex === 0 ? this.data.standards[0] : this.data.standards[this.data.standardIndex],
      standardIndex: this.data.standardIndex === 0 ? 0 : this.data.standardIndex
    })
    if (this.data.standardBox) {
      this.setData({
        isScroll: false
      })
    }
    this.canGroup();
  },
  closeChoose () {
    this.setData({
      standardBox: false,
      isScroll: true,
      groupMyId: null
    })
  },
  selectStandard (e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      standardIndex: index,
      sku: this.data.standards[index]
    })
    this.canGroup();
  },
  addNumber (e) {
    let index = e.currentTarget.dataset.index;
    let number = parseInt(e.currentTarget.dataset.number);
    if (number < 0 && this.data.buyNum < 2) {
      return
    }
    this.setData({
      buyNum: this.data.buyNum + number
    })
  },
  confirmBtn (e) {
    let that = this;
    let isAloneBuy = e ? e.currentTarget.dataset.isAloneBuy : true;
    let isOpenGroup = e ? e.currentTarget.dataset.isOpenGroup : false;
    this.setData({
      standardBox: false
    })
    let cartIds = []
    if (isAloneBuy) {
      util.request(api.addToCart, {
        productId: that.data.productId,
        number: that.data.buyNum,
        skuCode: that.data.sku.skuCode
      }, 'POST').then(res => {
        if (res.errno !== 0) {
          util.showErrorToast(res.errmsg);
          return;
        }

        cartIds.push(res.data.id);
        that.toSubmitOrder(isAloneBuy, isOpenGroup, cartIds, that.data.sku);
      })
    } else {
      if (!that.data.canOpenGroup) {
        util.showErrorToast('该规则不可参团！')
        return;
      }
      that.toSubmitOrder(isAloneBuy, isOpenGroup, cartIds, that.data.sku);
    }
  },
  addCart () {
    let that = this;
    that.setData({
      groupMyId: null
    })
    if (that.data.canOpenGroup && that.data.btnType !== 'cart') {
      that.confirmBtn();
      return;
    }
    util.request(api.addToCart, {
      productId: that.data.productId,
      number: that.data.buyNum,
      skuCode: that.data.sku.skuCode
    }, 'POST').then(res => {
      if (res.errno !== 0) {
        util.showErrorToast(res.errMsg);
        return
      }
      that.setData({
        standardBox: false,
        isScroll: true
      })
      util.showSuccessToast('加入购物车');
      this.findCart();
    })
  },
  initData () {
    let that = this;
    // wx.showLoading({
    //   title: '加载中',
    //   mask: true
    // })
    util.request(api.getProductDetail + that.data.productId).then(function (res) {
      if (res.errno !== 0) {
        return;
      }
      // wx.hideLoading();
      let headPic = res.data.headPic;
      let headPics = [];
      headPic.forEach(src => {
        headPics.push({
          type: src.indexOf('mp4') == -1 ? 'img' : 'video',
          src: src
        })
      });
      that.setData({
        goods: res.data,
        headTitle: res.data.name,
        headPic: headPics,
        footPic: res.data.footPic
      })
      if (headPic.length > 0) {
        if (that.data.headPic[0].type === 'video') {
          that.setData({
            Height: 424
          })
        } else {
          that.setData({
            Height: 750
          })
        }
      }
      wx.setNavigationBarTitle({
        title: that.data.goods.name
      })
    })
  },
  toSubmitOrder(isAloneBuy, isOpenGroup, cartIds, sku) {
    let groupMyId = this.data.groupMyId;
    let products = {
      data: {
        id: this.data.goods.id,
        normalPic: this.data.goods.normalPic,
        name: this.data.goods.name,
        number: this.data.buyNum,
        minPrice: isAloneBuy ? this.data.standards[this.data.standardIndex].promotionPrice : this.data.groupPrice,
        rulesNum: this.data.suitTypes[0] ? this.data.suitTypes[0].rulesNum : 0
      },
      cartIds: cartIds,
      sku: sku
    }
    wx.setStorageSync(
      "cartsKey",
      JSON.stringify(products)
    );
    let path = "../group/confirmOrder/confirmOrder?isAloneBuy="+isAloneBuy + '&expressCostId=' + this.data.brands.expressCostId;
    if (!isOpenGroup && groupMyId) {
      path = path + '&groupMyId=' + groupMyId;
    }
    wx.navigateTo({
      url: path
    })
  },
  findCart () {
    let that = this;
    util.request(api.findCart, {
      page: 1,
      size: 100
    }).then(res => {
      if (res.errno !== 0) {
        return;
      }
      let cart = res.data.cart;
      let cartNum = 0;
      cart.forEach(cart => {
        if (cart.cartListDtos.length > 0) {
          cartNum += cart.cartListDtos.length
        }
        that.setData({
          cartNum: cartNum
        })
      });
  })
  },
  showShareBox () {
    var params = 'P=' + this.data.productId + ',B=' + this.data.brandId;
    if (this.data.groupMyId != null) {
      params += ',G=' + this.data.groupMyId;
    }
    var route = {
      page: 'pages/goods/goods',
      parmas:  params
    };
    this.setData({
      showPoster: !this.data.showPoster,
      currentPage: JSON.stringify(route)
    })
  },
  onHide: function () { // navigateTo 或底部 tab 切换到其他页面触发
    this.setData({
      groupMyId: null,
      standardBox: false,
      isScroll: true,
      isLoaded: false
    })
  },
  onUnload: function () { // redirectTo或navigateBack到其他页面时触发
    this.setData({
      isLoaded: false
    })
  }
})
