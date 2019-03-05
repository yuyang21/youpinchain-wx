const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
const filter = require('../../../utils/filter');
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
    footPic: [],
    standardBox: false,
    mask_box_H: 0,
    showPoster: false,
  },
  onLoad: function (options) {
    util.dealwithInviter(options);
    var scene = {};
    if (options.scene) {
      var params = decodeURIComponent(options.scene).split(",");
      params.forEach(p => {
        scene[p.split("=")[0]] = p.split("=")[1];
      });
    }
    this.setData({
      groupSuitId: options.groupSuitId || scene.P,
      groupMyId: options.groupMyId || scene.G,
    });
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
  addCart () {

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
      let headPic = res.data.headPic;
      let headPics = [];
      headPic.forEach(src => {
        headPics.push({
          type: src.indexOf('mp4') == -1 ? 'img' : 'video',
          src: src
        })
      });
      that.setData({
        groupSuit: res.data.groupSuit,
        headTitle: res.data.groupSuit.suitName,
        suitTypes: res.data.suitTypes,
        headPic: headPics,
        footPic: res.data.footPic
      })

      if (headPic.length > 0) {
        if (that.data.headPic[0].type === 'video') {
          that.setData({
            Height: 424
          })
        } else {
          that.setData({
            Height: 750
          })
        }
      }

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

        // 拼团已满，则不显示拼团
        if (res.data.groupMy.joinNum >= res.data.groupMy.rulesNum || res.data.groupMy.groupStatus !== 1) {
          util.showErrorToast('该拼团已满！');
          wx.redirectTo({
              url: '/pages/group/groupDet/groupDet?groupSuitId=' + that.data.groupSuitId
          })
        } else {
            that.setData({
                groupMy: res.data.groupMy,
                groupPrice: res.data.groupMy.discountPrice,
                endTimeDown: res.data.groupMy.endTime - new Date().getTime() / 1000
            })

            util.countdown(that)
        }


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
  },
  showShareBox () {
    var route = {
      page: 'pages/group/groupDet/groupDet',
      parmas: 'P=' + this.data.groupSuitId + ',G=' + this.data.groupMyId
    };
    this.setData({
      goods: {
        name: this.data.groupSuit.suitName,
        describe: this.data.groupSuit.describe,
        normalPic: this.data.groupSuit.normalPic,
        presentPrice: this.data.groupSuit.suitPrice
      },
      showPoster: !this.data.showPoster,
      currentPage: JSON.stringify(route)
    })
  }
})
