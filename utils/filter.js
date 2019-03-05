// utils/filter.js
function loginAndInvestorCheck(pageObj) {
    if (pageObj.onLoad) {
        let _onLoad = pageObj.onLoad;
        // 使用onLoad的话需要传递options
        pageObj.onLoad = function (options) {
            let scene = {};
            if (options.scene) {
                let params = decodeURIComponent(options.scene).split(",");
                params.forEach(p => {
                    scene[p.split("=")[0]] = p.split("=")[1];
                    console.log('scene.' + p.split("=")[0] + ':' + p.split("=")[1])
                });
            }
            let inviter = options.inviter || scene.I || null;
            if (inviter != null && wx.getStorageSync('token')) {
                let that = this;
                util.request(api.saveInviter, {
                    inviter: that.data.inviter,
                    currentPage: 'pages/goods/goods?productId=' + that.data.productId
                }, 'POST').then(res => {})
            }

            // 获取当前页面
            let currentInstance = getPageInstance();
            _onLoad.call(currentInstance, options);
        }
    }
    return pageObj;
}

// 获取当前页面
function getPageInstance() {
    let pages = getCurrentPages();
    return pages[pages.length - 1];
}

exports.loginAndInvestorCheck = loginAndInvestorCheck;
