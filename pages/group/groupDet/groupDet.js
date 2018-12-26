const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    groupSuitId: null,
    showShare: false,
    headTitle: "",
    goodsid: "",
    groupMyId: '',
    groupMy: {},
    groupSuit: {},
    suitTypes: [],
    suitDet: [],
    groupPrice: 0,
    cart_num: 0,
    endTimeDown: 0,
    startTimeDown: 0,
    timer: null,
    headPic: [],
    footPic: []
  },
  onLoad: function (options) {
    this.setData({
      groupSuitId: options.groupSuitId || 57,
      groupMyId: options.groupMyId ? options.groupMyId : null
    })
  },
  onShareAppMessage: function (option) {
    let that = this;
    let obj = {
      title: '超值拼团 ' + that.data.groupSuit.suitName,
      path: that.route,
      imageUrl: that.data.groupSuit.thumbnailPic
    };
    return util.shareEvent(option, obj);
  },
  onShow: function () {
    this.initData();
  },
  initData () {
    let that = this;
    util.request(api.groupDet + that.data.groupSuitId).then(function (res) {
      if (res.errno !== 0) {
        return;
      }
      that.setData({
        groupSuit: res.data.groupSuit,
        headTitle: res.data.groupSuit.suitName,
        suitTypes: res.data.suitTypes,
        headPic: res.data.headPic,
        footPic: res.data.footPic
      })
      wx.setNavigationBarTitle({
        title: that.data.groupSuit.suitName
      })
      if (!that.data.groupMyId) {
        that.setData({
          groupPrice: res.data.suitTypes[0].discountPrice,
          endTimeDown: res.data.suitEndTimeDown
        })
        res.data.suitTypes.forEach(t => {
          that.setData({
            groupPrice: Math.min(that.data.groupPrice, t.discountPrice)
          })
        })
        util.countdown(that);
      }
    })

    // 有用户拼团Id，说明这是一个已开的团，只能参团
    if (that.data.groupMyId) {
      util.request('/groups/' + groupMyIdthat.data.groupSuitId + '/groupMys/' + that.data.groupMyId).then(function (res) {
        if (res.errno !== 0) {
          return;
        }
        that.setData({
          groupMy: res.data.groupMy,
          groupPrice: res.data.groupMy.discountPrice,
          endTimeDown: res.data.groupMy.endTime - new Date().getTime() / 1000
        })

        util.countdown(that)
      })
    }
    util.request('/groups/' + that.data.groupSuitId + '/pro').then(res => {
      if (res.errno !== 0) {
        return;
      }
      that.setData({
        suitDet: res.data
      })
    })
  },
  toSubmitOrder(event) {
    let type = event.currentTarget.dataset.type;
    if (this.data.groupMyId && this.data.endTimeDown <= 0) {
      wx.navigateTo({
        url: '../current/current'
      })
      return;
    }
    let suitDet = this.data.suitDet
    let groupSuit = this.data.groupSuit
    let currentTime = new Date().getTime();
    let groupMyId = this.data.groupMyId;
    wx.setStorageSync(
      "suit_" + currentTime,
      JSON.stringify(suitDet)
    );
    wx.setStorageSync(
      "groupSuit_" + currentTime,
      JSON.stringify(groupSuit)
    );
    wx.setStorageSync(
      "suitType_" + currentTime,
      JSON.stringify(this.data.suitTypes)
    );
    wx.navigateTo({
      url: '../confirmGroup/confirmGroup?type=' + type + '&groupKey=groupSuit_' + currentTime + '&suitKey=suit_' + currentTime + '&suitTypeKey=suitType_' + currentTime + '&groupMyId=' + groupMyId
    })
  }
})