const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    brand: {}
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
  onLoad: function () {
    this.setData({
    })
  },
  onShow: function () {
    this.getIndexData();
  }
})
