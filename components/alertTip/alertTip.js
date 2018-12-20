Component({
  /**
   * 组件的属性列表，使用组件时，传入的参数
   */
  properties: {
    alertText: {
      type: String,
      value: ''
    },
    type: {
      type: Number,
      value: 2
    }
  },

  /**
   * 组件的初始数据，组件内部的数据
   */
  data: {
  },

  /**
   * 组件的方法列表，组件内部的方法
   */
  methods: {
    cancelAlertTip: function () {
      var myEventDetail = {} // detail对象，提供给事件监听函数
      var myEventOption = {} // 触发事件的选项
      this.triggerEvent('myevent', myEventDetail, myEventOption)
    }
  }
})