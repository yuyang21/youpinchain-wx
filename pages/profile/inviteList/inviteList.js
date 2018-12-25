const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    list: [],
    showPoster: false,
    qrcode: Object,
    url: '',
    output: null,
    showImages: false,
    finishedDraw: false,
    page: 1,
    size: 10,
    totalPage: 1,
    loaded: false,
    loading: false
  },
  onLoad: function (options) {

  },
  onShow: function () {
    this.getList(this.data.page, this.data.size);
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
  },
  getList(page, size) {
    let that = this;
    that.setData({
      loading: true
    })
    util.request(api.userInvites, {
      page: page, 
      pageSize: size
    }).then(res => {
      let arr = res.data.data;
      that.setData({
        list: that.data.list.concat(arr),
        totalPage: res.data.totalPage,
        loading: false
      })
    })
  }
})