Component({
  /**
   * 组件的属性列表，使用组件时，传入的参数
   */
  properties: {
    orderId: {
      type: Number,
      value: ''
    }
  },

  /**
   * 组件的初始数据，组件内部的数据
   */
  data: {
    refund: ''
  },

  ready: function () {
  },
  detached: function () {
  },
  /**
   * 组件的方法列表，组件内部的方法
   */
  methods: {
    AlertTip (e) {
      let type = e.currentTarget.dataset.type
      var myEventDetail = {
        type: type,
        orderId: this.data.orderId,
        refund: this.data.refund
      } // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      this.triggerEvent('myevent', myEventDetail, myEventOption)
    }
  }
})