const util = require('../../utils/util.js');
Page({
  data: {
    brand: {}
  },
  onLoad: function (options) {
      this.setData({
        brandId: options.brandId
      })
  },
  onShow: function () {
    let that = this;
    util.request('/brands/' + that.data.brandId + '/info').then(res => {
        that.setData({
            brand: res.data
        })
    })
  }
})