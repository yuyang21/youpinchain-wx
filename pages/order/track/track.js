const util = require('../../../utils/util.js');
Page({
  data: {
    expNo: "",
    expCode: "",
    trackData: {}
  },
  onLoad: function (options) {
    this.setData({
      expNo: options.expNo || '821721174311',
      expCode: options.expCode || '11'
    })
    //TODO 测试使用单号
    if (!this.data.expNo) {
      this.setData({
        expNo: "821721174311"
      })
    }
    this.expresses();
  },
  expresses() {
    util.request('/expresses/' + this.data.expCode + '/' + this.data.expNo).then(res => {
      if (res.errno !== 0) {
        return;
      }
      this.setData({
        trackData: JSON.parse(res.data)
      })
      console.info(this.data.trackData)
    })
  }
})