const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    adressList: [], //地址列表,
    choosedAddressIndex: -1, // 用户选中的地址
    selectedAddress: true,
    queryPath: ''
  },
  onLoad: function (options) {
    if (options.path) {
      this.setData({
        queryPath: options.path
      })
    }
    if (this.data.queryPath !== 'confirmOrder') {
      this.setData({
        selectedAddress: false
      })
    }
  },
  onShow: function () {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    this.loadAddresses();
  },
  loadAddresses () {
    let that = this;
    util.request(api.getAddressList, {
      page: 1,
      pageSize: 100
    }).then(res => {
      that.setData({
        adressList: res.data
      })
      if (wx.getStorageSync('choosedAddress')) {
        var index = -1;
        let choosedAddress = JSON.parse(wx.getStorageSync('choosedAddress'));
        res.data.forEach(address => {
          index = index + 1;
          if (choosedAddress && address.id == choosedAddress.id) {
            that.setData({
              choosedAddressIndex: index
            })
          }
        });
      }
      wx.hideLoading();
    })
  }, 
  selectOrEdit (event) {
    let address = event.currentTarget.dataset.address;
    if (this.data.queryPath === 'confirmOrder') {
      wx.setStorageSync('choosedAddress', JSON.stringify(address));
      wx.navigateBack({
        delta: 1
      })
    } else {
      wx.navigateTo({
        url: '../edit/edit?addressId=' + address.id
      })
    }
  },
  toEdit (event) {
    let address = event.currentTarget.dataset.address;
    let query = '?addressId=' + address.id;
    if (this.data.queryPath === 'confirmOrder') {
      query = query + '&path=confirmOrder'
    }
    wx.navigateTo({
      url: '../edit/edit' + query
    })
  },
  toAddAddress() {
    let query = ''
    if (this.data.queryPath === 'confirmOrder') {
      query = '?path=confirmOrder'
    }
    wx.navigateTo({
      url: '../edit/edit' + query
    })
  }
})