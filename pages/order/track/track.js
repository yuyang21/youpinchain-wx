const util = require('../../../utils/util.js');
Page({
  data: {
    expNo: "",
    expCode: "",
    trackData: {}
  },
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
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
      wx.hideLoading();
      let trackData = JSON.parse(res.data);
      if (res.errno !== 0 || !trackData.data[0].time) {
        this.setData({
          trackData: null
        })
        return;
      }
      trackData.data.forEach(o => {
        o.time = new Date(o.time.replace(/-/g, '/')).getTime();
      });
      this.setData({
        trackData: trackData
      })
      console.info(this.data.trackData)
    })
  }
})