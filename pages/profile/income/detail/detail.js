const util = require('../../../../utils/util')
const api = require('../../../../config/api')
Page({
  data: {
    detailList: [],
    page: 1,
    size: 10,
    totalPage: 1,
    loading: false,
    loaded: false
  },
  onLoad: function (options) {

  },
  onShow: function () {
    this.getList(this.data.page, this.data.size);
  },
  getList(page, size) {
    let that = this;
    that.setData({
      loading: true
    })
    util.request(api.incomeDeals, {
      page: page, 
      pageSize: size
    }).then(res => {
      let arr = res.data.data;
      setTimeout(function () {
        that.setData({
          detailList: that.data.detailList.concat(arr),
          loading: false
        })
      }, 300)
    })
  },
  onReachBottom: function () {
    if (this.data.page >= this.data.totalPage) {
      this.setData({
        loaded: true
      })
      return;
    }
    this.setData({
      page: this.data.page + 1
    })
    this.getList(this.data.page, this.data.size);
  }
})