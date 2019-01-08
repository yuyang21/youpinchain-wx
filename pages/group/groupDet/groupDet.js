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
      groupSuitId: options.groupSuitId,
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
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request(api.groupDet + that.data.groupSuitId).then(function (res) {
      if (res.errno !== 0) {
        return;
      }
      wx.hideLoading();
      that.setData({
        groupSuit: res.data.groupSuit,
        headTitle: res.data.groupSuit.suitName,
        suitTypes: res.data.suitTypes,
        headPic: res.data.headPic,
        footPic: res.data.footPic
      })
      that.getDuitDet();
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
      util.request('/groups/' + that.data.groupSuitId + '/groupMys/' + that.data.groupMyId).then(function (res) {
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
  },
  addNumber(e) {
    let number = parseInt(e.currentTarget.dataset.number);
    let index = e.currentTarget.dataset.index;
    if (this.data.suitDet[index].buyNum <= 0 && number < 0) {
      return
    }
    let suitDet = this.data.suitDet;
    suitDet[index].buyNum = suitDet[index].buyNum + number;
    this.setData({
      suitDet: suitDet
    })
  },
  getDuitDet() {
    let that = this;
    util.request('/groups/' + that.data.groupSuitId + '/pro').then(res => {
      if (res.errno !== 0) {
        return;
      }
      let suitDet = res.data;
      suitDet.forEach(s => {
        s.suitNum = 0
      })
      that.setData({
        suitDet: suitDet
      })
    })
  },
  toSubmitOrder(event) {
    if (this.data.groupSuit.type === 2) {
      let isNum = 0;
      this.data.suitDet.forEach(s => {
        isNum += s.buyNum
      })
    }
    if (!this.data.groupMyId && this.data.endTimeDown <= 0) {
      wx.switchTab({
        url: '../current/current'
      })
      return;
    }
    let isAloneBuy = event.currentTarget.dataset.isAloneBuy;
    let isOpenGroup = event.currentTarget.dataset.isOpenGroup;
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
    let path = "../confirmGroup/confirmGroup?isAloneBuy="+isAloneBuy+"&groupKey=groupSuit_"+currentTime+"&suitKey=suit_" + currentTime+"&suitTypeKey=suitType_" + currentTime;
    if (!isOpenGroup) {
      path = path + '&groupMyId=' + groupMyId;
    }
    wx.navigateTo({
      url: path
    })
  }
})