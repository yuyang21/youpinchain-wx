const util = require('../../../utils/util')
const api = require('../../../config/api')
Page({
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
    provincesId: [],
    cityId: [],
    areaId: []
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
    if (options.path == 'confirmOrder') {
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
  submitAddress() {
    var address = this.address;
    if (address.id) {
      updateAddress(
        address.id,
        address.name,
        address.provinceId,
        address.cityId,
        address.areaId,
        address.mobile,
        address.address
      ).then(res => {
        if (res.errno == 0) {
          var index = 0;
          if (this.$route.query.path == 'confirmOrder') {
            localStorage.setItem('choosedAddress', JSON.stringify(address));
            this.$router.go(-2);
          } else {
            this.$router.go(-1);
          }
        }
      });
    } else {
      addAddress(
        address.name,
        address.provinceId,
        address.cityId,
        address.areaId,
        address.mobile,
        address.address,
        this.toggle
      ).then(res => {
        address.id = res.data;
        if (res.errno == 0) {
          var index = 0;
          if (this.$route.query.path == 'confirmOrder') {
            localStorage.setItem('choosedAddress', JSON.stringify(address));
            this.$router.go(-2);
          } else {
            this.$router.go(-1);
          }
        }
      });
    }
  },

  // 删除地址
  deleteAddress1() {
    var that = this;
    if (that.data.address.id) {
      deleteAddress(that.data.address.id).then(res => {
        if (res.errno == 0) {
          var sessionAddr = localStorage.getItem('choosedAddress');
          if (sessionAddr && JSON.parse(sessionAddr).id == that.address.id) {
            localStorage.removeItem('choosedAddress');
          }
          that.$router.go(-1);
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
    let provinces = this.data.region[0][arr[0]];
    let city = this.data.region[1][arr[1]];
    let area = this.data.region[2][arr[2]];
    let address = this.data.address;
    address.tipText = provinces + ' ' + city + ' ' + area;
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
      region[0] = that.returnListName(provinces, 'name');
      let provincesId = that.returnListName(provinces, 'id');
      console.log(region[0])
      console.log(provincesId)
      util.request(api.getRegionsList, {
        pid: provinces[0].id
      }).then((res) => {
        let city = res.data;
        let cityId = that.returnListName(city, 'id');
        region[1] = that.returnListName(city, 'name');
        console.log(region[1])
        console.log(cityId)
        util.request(api.getRegionsList, {
          pid: city[0].id
        }).then((res) => {
          let area = res.data;
          let areaId = that.returnListName(area, 'id');
          region[2] = that.returnListName(area, 'name');
          console.log(region[2])
          console.log(areaId)
          that.setData({
            region: region,
            provinces: region[0],
            city: region[1],
            area: region[2],
            provincesId: provincesId,
            cityId: cityId,
            areaId: areaId
          })
        })
      })
      console.log(that.data.region)
    })
  },
  bindMultiPickerColumnChange(e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value)
    // this.setData({
    //   region: [[],[],[]]
    // })
    switch (e.detail.column) {
      case 0:
        var region = [this.data.provinces, [],
          []
        ];
        var that = this;
        util.request(api.getRegionsList, {
          pid: this.data.provincesId[e.detail.value]
        }).then((res) => {
          let city = res.data;
          let cityId = [];
          city.forEach(p => {
            region[1].push(p.name);
            cityId.push(p.id);
          })
          util.request(api.getRegionsList, {
            pid: city[0].id
          }).then((res) => {
            let area = res.data;
            area.forEach(p => {
              region[2].push(p.name);
              that.setData({
                cityId: cityId,
                region: region
              })
            })
          })
        })
        break;
      case 1:
        var region = [this.data.provinces, this.data.city, []];
        var that = this;
        console.log(that.data.cityId);
        console.log(e.detail.value);
        util.request(api.getRegionsList, {
          pid: that.data.cityId[e.detail.value]
        }).then((res) => {
          let area = res.data;
          area.forEach(p => {
            region[2].push(p.name);
            that.setData({
              region: region
            })
          })
        })
        break;
    }
  }
})