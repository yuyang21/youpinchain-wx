const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
var user = require('../../../services/user.js');
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
    endTimeDown: 1,
    timer: null,
    systemTime: null,
    shareLink: '',
    qrcode: Object,
    output: null,
    sameAddressPrice: 0,
    diffetentAddressPrice: 0,
    sex: ''
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
      // countDown(that.endTimeDown, time => {
      //   that.endTimeDown = time
      // })
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
  showShareBox () {
    this.setData({
      showShare: !this.data.showShare
    })
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