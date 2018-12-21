const util = require('../../../utils/util.js');
const api = require('../../../config/api.js');
Page({
  data: {
    showShare: true,
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
  initData () {},

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