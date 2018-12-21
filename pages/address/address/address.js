const util = require('../../../utils/util');
const api = require('../../../config/api');
Page({
  data: {
    adressList: [], //地址列表,
    choosedAddressIndex: -1, // 用户选中的地址
    selectedAddress: true
  },
  onLoad: function (options) {
    if (options.path !== 'confirmOrder') {
      this.setData({
        selectedAddress: false
      })
    }
    this.loadAddresses();
  },
  onShow: function () {

  },
  loadAddresses() {
    util.request(api.getAddressList, {
      page: 1,
      pageSize: 100
    }).then(res => {
      this.setData({
        adressList: res.data
      })
      if (wx.getStorageSync('choosedAddress')) {
        var index = -1;
        let choosedAddress = JSON.parse(wx.getStorageSync('choosedAddress'));
        this.data.adressList.forEach(address => {
          index++;
          if (choosedAddress && address.id == choosedAddress.id) {
            this.setData({
              choosedAddressIndex: index
            })
          }
        });
      }
    })
  },
})