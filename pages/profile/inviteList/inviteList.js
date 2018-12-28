const util = require('../../../utils/util');
const api = require('../../../config/api');
const drawQrcode = require('../../../utils/weapp.qrcode.min.js');
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
    loading: false,
    windowHeight: wx.getSystemInfoSync().windowHeight,
    windowWidth: wx.getSystemInfoSync().windowWidth
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
    if (that.data.output) {
      that.setData({
        showPoster: true
      })
      return;
    }
    let url = '';
    util.request(api.inviteCode).then(res => {
      url = res.data;

      drawQrcode({
        width: 130,
        height: 130,
        canvasId: 'myQrcode',
        text: url
      })
      setTimeout(function(){
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 130,
          height: 130,
          destWidth: 130,
          destHeight: 130,
          canvasId: 'myQrcode',
          success(res) {
            console.log(res.tempFilePath);
            url = res.tempFilePath;

            const ctx = wx.createCanvasContext('myCanvas');
            const bg_src = '../../../static/images/bounty-plan/share_poster.png';
            ctx.drawImage(bg_src, 0, 0, 240, 425);

            ctx.setFontSize(11);
            ctx.setFillStyle("#333");
            ctx.fillText('领金条   拍大奖', 100, 142);
            ctx.fillText('拣金钻   兑好物', 100, 158);

            ctx.drawImage(url, 50, 180, 130, 130);

            ctx.setFontSize(10);
            ctx.setFillStyle("#333");
            ctx.fillText('争做创世居民，送无门槛竞拍', 55, 335);
            ctx.fillText('礼包，有实惠，优先享。', 55, 350);

            ctx.draw();
            that.print();
          }
        })
      }, 500)
    })
    that.setData({
      showPoster: true
    })
  },
  print() {
    let that = this;
    wx.showToast({
      title: '分享图片生成中...',
      icon: 'loading',
      duration:1000
    });
    setTimeout(function(){
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: 240,
        height: 425,
        destWidth: 240,
        destHeight: 425,
        canvasId: 'myCanvas',
        success(res) {
          console.log(res.tempFilePath);
          that.setData({
            output: res.tempFilePath
          })
        }
      })
    }, 500)
  }
})