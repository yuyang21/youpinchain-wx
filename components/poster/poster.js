const util = require('../../utils/util.js')
const api = require('../../config/api.js')
Component({
    /**
     * 组件的属性列表，使用组件时，传入的参数
     */
    properties: {
        goods: {
            type: Object,
            value: {}
        },
        currentPage: {
            type: String,
            value: ''
        },
        groupPrice: {
          type: String,
          value: ''
        }
    },
    options: {
        addGlobalClass: true,
    },
    data: {
        output: null,
        imgSrc: '',
        width: wx.getSystemInfoSync().windowWidth * 0.84,
        height: wx.getSystemInfoSync().windowWidth * 1.15,
        imageCreateSuccess: false
    },
    ready: function () {
        let that = this;
        wx.showLoading({
          title: '分享图片生成中...',
        }, that);
        wx.getImageInfo({
            src: that.data.goods.normalPic,//服务器返回的带参数的小程序码地址
            success: function (sres) {
              that.setData({
                imgSrc: sres.path
              })
              that.showShareBox(that.data.currentPage);
            },
            fail: function (res) {
                //失败回调
            }
        }, that);
    },
    methods: {
        closeMask (e) {
            this.triggerEvent('myevent');
        },
        // !!! 注意，分享参数只能有32个字符大小，否则生成二维码会报错
        showShareBox (route) {
            let that = this;
            let router = JSON.parse(route);
            let params = router.parmas;
            util.request(api.userInfo, {}, 'GET').then(function (res) {
                if (res.errno === 0) {
                    params += ',I=' + res.data.vipId;
                }
                util.request(api.qrCode, {
                    page: router.page,
                    scene: params
                }, 'POST').then(res => {
                    if (res.errno !== 0) {
                        // that.showShareBox(that.data.currentPage);
                        return;
                    }
                    let url = ('data:image/png;base64,'+res.data).replace(/[\r\n]/g, "");
                    util.base64src(url).then(res => {
                        console.log(res)
                        const ctx = wx.createCanvasContext('myCanvas', that);

                        ctx.fillStyle="#FFFFFF";
                        ctx.fillRect(0, 0, that.data.width, that.data.height);
                        ctx.drawImage(that.data.imgSrc, 0, 0, that.data.width, that.data.height * 0.38);

                        ctx.setFontSize(15);
                        ctx.setFillStyle("#000000");
                        ctx.fillText(that.data.goods.name.length > 8 ? that.data.goods.name.slice(0, 8) + '...' : that.data.goods.name, that.data.width * 0.049, that.data.height * 0.498);

                        ctx.setFontSize(11);
                        ctx.setFillStyle("#8f8f8f");
                        ctx.fillText(that.data.goods.describe.slice(0, 20), that.data.width * 0.049, that.data.height * 0.648);
                        if (that.data.goods.describe.length > 20){
                            ctx.fillText(that.data.goods.describe.slice(20, 40), that.data.width * 0.049, that.data.height * 0.698);
                        }
                        if (that.data.goods.describe.length > 40) {
                            ctx.fillText(that.data.goods.describe.length > 55 ? that.data.goods.describe.slice(40, 55) + '...' : that.data.goods.describe, that.data.width * 0.049, that.data.height * 0.748);
                        }
                        // ctx.setFontSize(11);
                        // ctx.setFillStyle("#434343");
                        // ctx.fillText(that.data.goods.describe.length > 10 ? that.data.goods.describe.slice(0, 10) + '...' : that.data.goods.describe, that.data.width * 0.049, that.data.height * 0.748);

                        ctx.setFontSize(10);
                        ctx.setFillStyle("#782222");
                        ctx.fillText('单独购买价 ¥', that.data.width * 0.049, that.data.height * 0.558);
                        ctx.setFontSize(10);
                        ctx.fillText(that.data.goods.originalPrice, that.data.width * 0.28, that.data.height * 0.558);
                        if (that.data.groupPrice){
                            ctx.fillText('拼团价 ¥', that.data.width * 0.43, that.data.height * 0.558);
                            ctx.setFontSize(10);
                            ctx.fillText(that.data.groupPrice, that.data.width * 0.59, that.data.height * 0.558);
                        }

                        ctx.drawImage(res, that.data.width * 0.66, that.data.height * 0.75, that.data.width * 0.32, that.data.width * 0.32);

                        ctx.draw(false, () => {
                            that.print();
                        });

                    })
                })
            });

        },
        print() {
            let that = this;
            // setTimeout(function(){
                wx.canvasToTempFilePath({
                    x: 0,
                    y: 0,
                    width: that.data.width,
                    height: that.data.height,
                    destWidth: that.data.width * 5,
                    destHeight: that.data.height * 5,
                    canvasId: 'myCanvas',
                    success(res) {
                        // console.log(res.tempFilePath);
                        that.setData({
                            output: res.tempFilePath,
                            imageCreateSuccess: true
                        })
                        wx.hideLoading()
                    }
                }, that)
            // }, 1000)
        },
        saveImg () {
            wx.saveImageToPhotosAlbum({
                filePath: this.data.output,
                success: function (data) {
                    util.showSuccessToast('保存成功');
                }
            }, this)
        }
    }
  })
