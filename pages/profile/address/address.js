const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    adressList: [], //地址列表,
    choosedAddressIndex: -1, // 用户选中的地址
    selectedAddress: true,
    queryPath: '',
    addressList: [],
    groupSuitId: 0,
    isAddressList: []
  },
  onLoad: function (options) {
    if (options.path) {
      this.setData({
        queryPath: options.path
      })
    }
    if (this.data.queryPath !== 'confirmOrder') {
      this.setData({
        selectedAddress: false,
      })
    } else {
      this.setData({
        groupSuitId: options.groupSuitId
      })
    }
  },
  onShow: function () {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request(api.getAddressByGroupSuit + this.data.groupSuitId).then(res => {
      this.setData({
        isAddressList: res.data
      })
    })
    this.loadAddresses();
  },
  loadAddresses () {
    let that = this;
    util.request(api.getAddressList, {
      page: 1,
      pageSize: 100
    }).then(res => {
      let newAddressList = [];
      res.data.forEach(a => {
        this.data.isAddressList.forEach(address => {
          if (address.id == a.id) {
            a.isAddress = true
          }
        })
        newAddressList.push(a);
      })
      that.setData({
        adressList: newAddressList
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