Component({
    /**
     * 组件的属性列表，使用组件时，传入的参数
     */
    properties: {
        goBack: {
            type: Boolean,
            value: true
        },
        isShare: {
            type: Boolean,
            value: true
        }
    },
    options: {
        addGlobalClass: true,
    },
    data: {
    },
    methods: {
        showMask (e) {
            this.triggerEvent('myevent')
        }
    }
  })