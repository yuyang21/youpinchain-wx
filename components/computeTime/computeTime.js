Component({
  /**
   * 组件的属性列表，使用组件时，传入的参数
   */
  properties: {
    time: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据，组件内部的数据
   */
  data: {
    countNum: 0,
    countDown: null,
    timer: null
  },
  ready: function () {
    this.countNum = this.numTime(this.data.time);
    this.setData({
      countDown: this.remaining(this.countNum)
    })
    this.remainingTime();
  },
  detached: function () {
    clearInterval(this.timer);
  },
  /**
   * 组件的方法列表，组件内部的方法
   */
  methods: {
    //计算时间
    remainingTime() {
      let that = this;
      if (that.countNum < 0) {
        clearInterval(that.timer);
        return;
      }
      clearInterval(that.timer);
      that.timer = setInterval(() => {
        that.countNum -= 1000;
        that.setData({
          countDown: that.remaining(that.countNum)
        })
      }, 1000);
    },
    //转换时间成分秒
    remaining: function (countNum) {
      let minute = parseInt(countNum / 60 / 1000);
      let second = parseInt((countNum / 1000) % 60);
      if (minute < 10) {
        minute = '0' + minute;
      }
      if (second < 10) {
        second = '0' + second;
      }
      if (countNum > 0) {
        return '支付 ' + minute + ':' + second;
      } else {
        return '支付超时'
      }
    },
    //订单返回时间秒分分别处理
    numTime: function (time) {
      if (time.toString().indexOf('分钟') !== -1) {
        return parseInt(time) * 60;
      } else {
        return parseInt(time);
      }
    }
  }
})