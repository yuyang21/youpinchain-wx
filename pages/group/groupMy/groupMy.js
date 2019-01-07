const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
const drawQrcode = require('../../../utils/weapp.qrcode.min.js');
Page({
  data: {
    showShare: false,
    groupMyId: '',
    groupSuit: {},
    groupMy: {},
    members: [],
    page: 1,
    size: 10,
    totalPages: 1,
    leaderAddress: {},
    endTimeDown: 0,
    timer: null,
    systemTime: null,
    shareLink: '',
    qrcode: Object,
    output: null,
    url: '',
    sameAddressPrice: 0,
    diffetentAddressPrice: 0,
    sex: '',
    width: wx.getSystemInfoSync().windowWidth * 0.84,
    height: wx.getSystemInfoSync().windowWidth * 1.15
  },
  onLoad: function (options) {
    this.setData({
      groupMyId: options.groupMyId
    }) 
    util.request(api.systemTime).then((res) => {
      this.setData({
        systemTime: res.data
      })
      this.initData();
    })
  },
  onShow: function () {
    this.getMembers(this.data.page, this.data.size);
  },
  onShareAppMessage: function (option) {
    let that = this;
    let obj = {
      title: '我发起了一个拼团，大家一起来拼团吧 ' + that.data.groupSuit.suitName,
      path: that.data.shareLink,
      imageUrl: that.data.groupSuit.thumbnailPic
    };
    return util.shareEvent(option, obj);
  },
  initData () {
    let that = this;
    util.request('/groups/0/groupMys/' + that.data.groupMyId).then(res => {
      if (res.errno !== 0) {
        return;
      }
      that.setData({
        groupMy: res.data.groupMy,
        leaderAddress: res.data.orderAddressVo,
        endTimeDown: res.data.groupMy.endTime - that.data.systemTime
      })
      util.countdown(that);
      util.request(api.groupSuit + that.data.groupMy.groupSuitId).then(res => {
        that.setData({
          groupSuit: res.data.groupSuit
        })
        var shareLink = '../groupDet/groupDet?groupSuitId=' + that.data.groupSuit.id + '&groupMyId=' + that.data.groupMyId;
        let sessionUserInfo = wx.getStorageSync("userInfo");
        if (sessionUserInfo) {
          that.setData({
            shareLink: shareLink + "&inviter=" + JSON.parse(sessionUserInfo).vipId,
            sex: JSON.parse(sessionUserInfo).sex
          })
        }
        res.data.suitTypes.forEach(item => {
          if (item.type === 1) {
            that.setData({
              diffetentAddressPrice: item.discountPrice
            })
          } else {
            that.setData({
              sameAddressPrice: item.discountPrice
            })
          }
        });
      })
    })
  },
  showShareBox (e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    if (type === 'close') {
      that.setData({
        showShare: false
      })
      return
    }
    if (that.data.output) {
      that.setData({
        showShare: true
      })
      return;
    }
    let url = '';
    that.setData({
      showShare: true
    })
    drawQrcode({
      width: 130,
      height: 130,
      canvasId: 'myQrcode',
      text: that.data.shareLink
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

          that.setData({
            url: url,
            showShare: true
          })

          const ctx = wx.createCanvasContext('myCanvas');
          ctx.fillStyle="#FFFFFF";
          ctx.fillRect(0, 0, that.data.width, that.data.height);

          ctx.setFontSize(12);
          ctx.setFillStyle("#000");
          ctx.fillText(that.data.leaderAddress.consignee, that.data.width * 0.28, that.data.height * 0.08);
          ctx.setFontSize(11);
          ctx.setFillStyle("#3B3B3B");
          ctx.fillText('邀请您参加它的团购', that.data.width * 0.43, that.data.height * 0.08);

          if (that.data.groupMy.groupSuitType === 2) {
            let address = '同一收货地址：' + that.data.leaderAddress.address;
            ctx.setFontSize(10);
            ctx.setFillStyle("#3B3B3B");
            ctx.fillText(address, that.data.width * 0.28, that.data.height * 0.125);
          }

          ctx.fillStyle = "#A40000";
          ctx.fillRect(that.data.width * 0.049, that.data.height * 0.138, that.data.width * 0.89, that.data.height * 0.49);
          ctx.drawImage(that.data.groupSuit.sharePic, that.data.width * 0.064, that.data.height * 0.15, that.data.width * 0.86, that.data.height * 0.38);
          const icon_src = '../../../static/images/group/icon_share.png';
          ctx.drawImage(icon_src, that.data.width * 0.05, that.data.height * 0.04, that.data.width * 0.2, that.data.width * 0.19);
          ctx.setFontSize(17);
          ctx.setFillStyle("#fff");
          ctx.fillText('¥100.0' + that.data.groupMy.discountPrice, that.data.width * 0.075, that.data.height * 0.6);
          ctx.setFontSize(12);
          ctx.fillText('/份', that.data.width * 0.28, that.data.height * 0.598);
          ctx.setFontSize(11);
          ctx.fillText(that.data.groupSuit.minimum + '份起订', that.data.width * 0.37, that.data.height * 0.598);
          ctx.fillStyle = "#FFFF00";
          ctx.fillRect(that.data.width * 0.585, that.data.height * 0.566, that.data.width * 0.29, that.data.height * 0.034); 
          ctx.setFontSize(10);
          ctx.setFillStyle("#A40000");
          ctx.fillText('拼团中', that.data.width * 0.68, that.data.height * 0.593);
          ctx.arc(that.data.width * 0.585, that.data.height * 0.583, that.data.height * 0.034 / 2, 0, Math.PI * 2, false);
          ctx.setFillStyle('#FFFF00');
          ctx.fill();
          ctx.arc(that.data.width * 0.88, that.data.height * 0.583, that.data.height * 0.034 / 2, 0, Math.PI * 2, false);
          ctx.setFillStyle('#FFFF00');
          ctx.fill();
          ctx.setFontSize(15);
          ctx.setFillStyle("#262424");
          ctx.fillText(that.data.groupSuit.suitName, that.data.width * 0.049, that.data.height * 0.698);
          ctx.setFontSize(11);
          ctx.setFillStyle("#434343");
          ctx.fillText(that.data.groupSuit.describe, that.data.width * 0.049, that.data.height * 0.748);
          ctx.setFontSize(13);
          ctx.setFillStyle("#A40000");
          ctx.fillText('同一地址团购：¥ ' + that.data.sameAddressPrice, that.data.width * 0.049, that.data.height * 0.818);
          ctx.setFontSize(11);
          ctx.setFillStyle("#000");
          ctx.fillText('不同地址团购：¥ ' + that.data.diffetentAddressPrice, that.data.width * 0.049, that.data.height * 0.87);
          ctx.setFontSize(11);
          ctx.setFillStyle("#000");
          ctx.fillText('单买价：¥ ' + that.data.groupSuit.suitPrice, that.data.width * 0.049, that.data.height * 0.918);

          ctx.drawImage(url, that.data.width * 0.56, that.data.height * 0.68, that.data.width * 0.38, that.data.width * 0.38);

          ctx.draw();
          that.print();
        }
      })
    }, 500)
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
        width: that.data.width, 
        height: that.data.height,
        destWidth: that.data.width, 
        destHeight: that.data.height,
        canvasId: 'myCanvas',
        success(res) {
          console.log(res.tempFilePath);
          that.setData({
            output: res.tempFilePath
          })
        }
      })
    }, 1000)
  },
  getMembers(page, size) {
    let that = this;
    util.request('/groups/0/groupMys/' + that.data.groupMyId + '/members', {
      page: page,
      pageSize: size
    }).then(res => {
      that.setData({
        members: res.data.members,
        totalPages: res.data.totalPages
      })
    })
  },
  loadMoreMember() {
    this.setData({
      page: this.data.page + 1
    })
    this.getMembers(this.page, this.size);
  }
})