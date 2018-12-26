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
  },
  sharePoster(e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    if (type === 'close') {
      that.setData({
        showPoster: false
      })
      return;
    }
    //获取我的分享码
    util.request(api.inviteCode).then(res => {
      that.setData({
        url: res.data,
        showPoster: true
      })
      // that.qrcode = new QRCode(document.getElementById('qrcode_1'), {
      //   text: that.url,
      //   width: 150,
      //   height: 150,
      //   colorDark: '#000000',
      //   colorLight: '#ffffff'
      // })
      if (that.data.finishedDraw) {
        return
      }
      setTimeout(function () {
        if (that.data.url) {
          // that.print()
        }
      }, 100)
      that.setData({
        finishedDraw: true
      })
    })
  },
  print() {}
})