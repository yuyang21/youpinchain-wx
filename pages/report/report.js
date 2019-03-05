const util = require('../../utils/util.js');
Page({
  data: {
    inspectionReportImg: []
  },
  onLoad: function (options) {
    console.log(options)
    util.request('/products/' + options.productId + '/report').then(res => {
        let reports = res.data[options.reportId];
        this.setData({
            inspectionReportImg: JSON.parse(reports.value).inspectionReportImg
        })
        wx.setNavigationBarTitle({
            title: reports.name
        })
    })
  }
})