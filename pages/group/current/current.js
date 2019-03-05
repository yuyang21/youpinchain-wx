const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
const filter = require('../../../utils/filter');
Page({
  data: {
    brand: {},
    goOnList: [],
    productList: [],
    page: 1,
    size: 8,
    total: 1,
    loading: true,
    loaded: false
  },
  getIndexData: function () {
      let that = this;
      util.request(api.homeIndex).then(function (res) {
          if (res.errno === 0) {
              that.setData({
                  brand: res.data.brand
              });
          }
          setTimeout(function () {
              wx.hideLoading()
          }, 100)
      });
  },
  getList: function () {
      let that = this;
      util.request(api.groupList, {page: 1, size: 100}).then(function (res) {
          if (res.errno === 0) {
              that.setData({
                  goOnList: res.data.goOn
              })
              that.getProducts(that.data.page, that.data.size);
          }
      })
  },
  onLoad: function (options) {
    util.dealwithInviter(options);
    wx.showLoading({
      title: '加载中',
    })
    this.setData({
      productList: [],
      page: 1
    })
    this.getIndexData();
    this.getList();

    var scanParams = {};
    if (options.q) {
      var params = decodeURIComponent(options.q).slice("https://zhenpin.datbc.com/miniprogram?".length).split(",");
        params.forEach(p => {
            scanParams[p.split("=")[0]] = p.split("=")[1];
        });
    }
  },
  getProducts (page, size) {
    let that = this;
    util.request(api.products, {page: page, size: size}).then(function (res) {
      if (res.errno === 0) {
        that.setData({
          total: res.data.total,
          productList: that.data.productList.concat(res.data.data),
          loading: false
        })
      }
    })
  },
  onShow: function () {
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.total < this.data.size || this.data.page * this.data.size >= this.data.total) {
      this.setData({
        loaded: true,
        loading: false
      })
      return;
    }
    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.getProducts(this.data.page, this.data.size);
  },
  onPullDownRefresh: function (){
    wx.showToast({
      title:'loading....',
      icon:'loading'
    })
    this.setData({
      productList: [],
      page: 1
    })
    this.getIndexData();
    this.getList();
  }
})

