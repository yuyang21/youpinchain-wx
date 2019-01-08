const util = require('../../../utils/util')
const api = require('../../../config/api')
var commonMixin = require('../../../mixins/commonMixin');
Page(Object.assign({
  data: {
    showAlertTip: false, //弹出框
    deleteNumber: "",
    address: {},
    provinces: [],
    submitText: '保存',
    showDelete: true,
    toggle: false,
    region: [],
    provinces: [],
    city: [],
    area: [],
    provinceIds: [],
    cityIds: [],
    areaIds: [],
    queryPath: ''
  },
  onLoad: function (options) {
    let that = this;
    if (options.addressId != undefined) {
      util.request('/addresses/' + options.addressId).then(res => {
        let address = res.data;
        address.tipText = address.provinceName + " " + address.cityName + " " + address.areaName;
        that.setData({
          address: address
        })
      });
    }
    if (options.number) {
      that.setData({
        deleteNumber: options.number
      })
    }
    if (options.path) {
      that.setData({
        queryPath: options.path
      })
    }
    if (this.data.queryPath == 'confirmOrder') {
      that.setData({
        submitText: '保存并使用',
        showDelete: false
      })
    }
  },
  onShow: function () {
    this.setRegions(0, 0);
  },
  // 保存地址
  submitAddress(e) {
    let address = Object.assign(e.detail.value, this.data.address);
    if (!util.checkAddress(address)) {
      return;
    }
    if (address.id) {
      util.request(api.updateAddress + address.id, {
        name: address.name,
        provinceId: address.provinceId,
        cityId: address.cityId,
        areaId: address.areaId,
        mobile: address.mobile,
        address: address.address
      }, 'PUT').then(res => {
        if (res.errno == 0) {
          if (this.data.queryPath == 'confirmOrder') {
            wx.setStorageSync('choosedAddress', JSON.stringify(address));
            wx.navigateBack({
              delta: 2
            })
          } else {
            wx.navigateBack({
              delta: 1
            })
          }
        } else {
          util.showErrorToast(res.errmsg)
        }
      });
    } else {
      util.request(api.addAddress, {
        name: address.name,
        provinceId: address.provinceId,
        cityId: address.cityId,
        areaId: address.areaId,
        mobile: address.mobile,
        address: address.address,
        isDefault: this.data.toggle
      }, 'POST').then(res => {
        address.id = res.data;
        if (res.errno == 0) {
          if (this.data.queryPath == 'confirmOrder') {
            wx.setStorageSync('choosedAddress', JSON.stringify(address));
            wx.navigateBack({
              delta: 2
            })
          } else {
            wx.navigateBack({
              delta: 1
            })
          }
        } else {
          util.showErrorToast(res.errmsg)
        }
      });
    }
  },

  // 删除地址
  deleteAddress1(e) {
    // e.detail // 自定义组件触发事件时提供的detail对象
    this.setData({
      showAlertTip: !this.data.showAlertTip
    })
    var that = this;
    if (e.detail.type == 1 && that.data.address.id) {
      wx.showLoading({
        title: '删除中',
        mask: true
      })
      util.request(api.deleteAddress + that.data.address.id, {}, 'DELETE').then(res => {
        if (res.errno == 0) {
          var sessionAddr = wx.getStorageSync('choosedAddress');
          if (sessionAddr && JSON.parse(sessionAddr).id == that.data.address.id) {
            wx.removeStorageSync('choosedAddress');
          }
          wx.hideLoading();
          wx.navigateBack({
            delta: 1
          })
        }
      });
    }
  },
  switchChange(e) {
    this.setData({
      toggle: e.detail.value
    })
  },
  changeRegin(e) {
    let arr = e.detail.value;
    let address = this.data.address;
    address.provinceId = this.data.provinceId;
    address.cityId = this.data.cityId;
    address.areaId = this.data.areaId;
    address.provinceName = this.data.region[0][arr[0]];
    address.cityName = this.data.region[1][arr[1]];
    address.areaName = this.data.region[2][arr[2]];
    address.tipText = address.provinceName + ' ' + address.cityName + ' ' + address.areaName;
    this.setData({
      address: address
    });
  },
  returnListName(list, type) {
    let arr = [];
    list.forEach(t => {
      arr.push(t[type])
    })
    return arr;
  },
  setRegions(pid) {
    let that = this;
    var region = [
      [],
      [],
      []
    ];
    util.request(api.getRegionsList, {
      pid: pid
    }).then((res) => {
      let provinces = res.data;
      let provinceId = provinces[0].id;
      region[0] = that.returnListName(provinces, 'name');
      util.request(api.getRegionsList, {
        pid: provinceId
      }).then((res) => {
        let city = res.data;
        let cityId = city[0].id;
        region[1] = that.returnListName(city, 'name');
        util.request(api.getRegionsList, {
          pid: cityId
        }).then((res) => {
          let area = res.data;
          let areaIds = area[0].id;
          region[2] = that.returnListName(area, 'name');
          that.setData({
            region: region,
            provinces: region[0],
            city: region[1],
            area: region[2],
            provinceIds: that.returnListName(provinces, 'id'),
            cityIds: that.returnListName(city, 'id'),
            areaIds: that.returnListName(area, 'id'),
            provinceId: provinceId,
            cityId: cityId,
            areaId: areaIds
          })
        })
      })
      // console.log(that.data.region)
    })
  },
  bindMultiPickerColumnChange(e) {
    // console.log('修改的列为', e.detail.column, '，值为', e.detail.value)
    switch (e.detail.column) {
      case 0:
        var region = [this.data.provinces, [], []];
        var that = this;
        util.request(api.getRegionsList, {
          pid: this.data.provinceIds[e.detail.value]
        }).then((res) => {
          let city = res.data;
          let cityIds = [];
          city.forEach(p => {
            region[1].push(p.name);
            cityIds.push(p.id);
          })
          util.request(api.getRegionsList, {
            pid: city[0].id
          }).then((res) => {
            let area = res.data;
            area.forEach(p => {
              region[2].push(p.name);
              that.setData({
                cityIds: cityIds,
                region: region,
                provinceId: this.data.provinceIds[e.detail.value],
                cityId: city[0].id,
                areaId: area[0].id
              })
            })
          })
        })
        break;
      case 1:
        var region = [this.data.provinces, this.data.city, []];
        var that = this;
        util.request(api.getRegionsList, {
          pid: that.data.cityIds[e.detail.value]
        }).then((res) => {
          let area = res.data;
          area.forEach(p => {
            region[2].push(p.name);
            that.setData({
              region: region,
              cityId: that.data.cityIds[e.detail.value],
              areaId: area[0].id
            })
          })
        })
        break;
      case 2:
        this.setData({
          areaId: this.data.areaIds[e.detail.value]
        })
        break;
    }
  }
}, commonMixin))