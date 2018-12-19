const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    brand: {},
    goOnList: [],
    page: 1,
    size: 10,
    totalPage: 1,
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
    });
  },
  getList: function (page, size) {
    let that = this;
    util.request(api.groupList, {page: page, size: size}).then(function (res) {
      if (res.errno === 0) {
        that.setData({
          totalPage: res.data.goOn.length,
          goOnList: res.data.goOn.slice(0, page * size),
          loading: false
        })
      }
    })
  },
  toDetail: function (event) {
    // let id = event.currentTarget.dataset.groupSuitId;
    // wx.navigateTo({
    //   url: '../groupDet/groupDet?groupSuitId=' + id
    // })
  },
  onLoad: function () {
  },
  onShow: function () {
    this.getIndexData();
    this.getList(this.data.page, this.data.size);
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.totalPage < this.data.size || this.data.page * this.data.size >= this.data.totalPage) {
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
    this.getList(this.data.page, this.data.size);
  }
})
