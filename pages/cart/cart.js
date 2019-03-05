const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp();
Page({
    data: {
        selectAll: true,
        totalPrice: 0,
        goodsPrice: 0,
        payment: 0,
        fare: 0,
        carts: [],
        hotgoodslist: [],
        showMoveDot: [], //控制下落的小圆点显示隐藏
        elLeft: 0, //当前点击加按钮在网页中的绝对top值
        elBottom: 0, //当前点击加按钮在网页中的绝对left值
        hasMore: false,
        proIds: null
    },
    onLoad: function (options) {
        if (options.rebuyKey) {
            this.setData({
                proIds: JSON.parse(wx.getStorageSync(options.rebuyKey))
            });
        }
    },
    onUnload: function () {
        wx.removeStorageSync('choosedCoupon');
    },
    onShow: function () {
        // util.request(api.productHotList).then(res => {
        //     this.setData({
        //         hotgoodslist: res.data.productList,
        //         hasMore: res.data.totalPages > this.data.page
        //     })
        // })
        this.setData({
            choosedCoupon: wx.getStorageSync('choosedCoupon') ? JSON.parse(
              wx.getStorageSync('choosedCoupon')
            ) : null
        })
        this.loadCarts();
        this.getCoupon();
    },
    getCoupon () {
      util.request(api.couponList, {
        page: 1,
        size: 100
      }).then(res => {
        if (res.errno !== 0) {
            return;
        }
        this.setData({
          coupon: res.data
        })
        if (res.data.length <= 0) {
            wx.removeStorageSync('choosedCoupon');
        }
      })
    },
    loadCarts () {
        var that = this;
        util.request(api.findCart, {
            page: 1, 
            size: 100
        }).then(res => {
            let carts = res.data.cart;
            carts.forEach(cart => {
                cart.choose = true;
                if (cart.cartListDtos)
                    cart.cartListDtos.forEach(cartList => {
                        cartList.choose = true;
                        if (that.data.proIds) {
                            if (that.data.proIds.indexOf(cartList.productId) === -1) {
                                cartList.choose = false;
                            }
                        }
                        cartList.available = true;
                        if (cartList.stock - cartList.number < 0 || !cartList.isShow) {
                            cartList.available = false;
                        }
                    })
            });
            that.setData({
                carts: carts
            })
            that.reComputePrice();
        });
    },
    addToCart(e) {
        let product = e.currentTarget.dataset.cart;
        var that = this
        if (product.stock <= 0) {
            util.showErrorToast('库存不足');
            return;
        }
        util.request(api.addToCart, {
            productId: product.id, 
            number: 1
        }, 'POST').then(res => {
            that.loadCarts();
        })
    },
    checkCart (e) {
        let carts = this.data.carts;
        let cart = e.currentTarget.dataset.cartList;
        let brandIndex = e.currentTarget.dataset.brandIndex;
        if (cart.cartListDtos) { // 商标选择
            carts[brandIndex].choose = !carts[brandIndex].choose;
            carts[brandIndex].cartListDtos.forEach(cartList => {
                cartList.choose = carts[brandIndex].choose;
            })
        } else { // 单独选择
            let index = e.currentTarget.dataset.index;
            let selectBrand = false;
            carts[brandIndex].cartListDtos[index].choose = !carts[brandIndex].cartListDtos[index].choose;
            carts[brandIndex].cartListDtos.forEach(cart => {
                if (cart.choose) {
                    selectBrand = true;
                }
            })
            carts[brandIndex].choose = selectBrand;
        }
        this.setData({
            carts: carts
        })
        this.reComputePrice();
    },
    checkSelectAll () {
        let selectAll = !this.data.selectAll;
        let carts = this.data.carts;
        carts.forEach(cart => {
            cart.choose = selectAll;
            if (cart.cartListDtos)
                cart.cartListDtos.forEach(cartList => {
                    cartList.choose = selectAll;
                })
        });
        this.setData({
            selectAll: selectAll,
            carts: carts
        })
        this.reComputePrice();
    },
    /**
     * 重新计算购物车中商品价格
     */
    reComputePrice () {

        app.findCart();
        this.setData({
            goodsPrice: 0,
            payment: 0,
            totalPrice: 0,
            fare: 0
        })
        var brandNum = 0;
        var brandPrice = 0;
        var goodsPrice = 0;
        var payment = 0;
        var fare = 0;
        this.data.carts.forEach(cart => {

            if (cart.cartListDtos && cart.cartListDtos.length > 0) {
                cart.cartListDtos.forEach(cartItem => {
                    if (cartItem.choose && cartItem.available) {
                        let itemGoodsPrice = cartItem.presentPrice * cartItem.number;
                        goodsPrice += itemGoodsPrice;
                        payment += itemGoodsPrice;
                        brandNum += cartItem.number;
                        brandPrice += itemGoodsPrice;
                    }
                })
                if (brandNum > 0) {
                    if (cart.expressCost && cart.expressCost.freeExpress === 1 && brandPrice < cart.expressCost.freeExpressValue) { // 下单金额
                        fare += cart.expressCost.expressPrice;
                    }
                    if (cart.expressCost && cart.expressCost.freeExpress === 2 && brandNum < cart.expressCost.freeExpressValue) { // 下单金额
                        fare += cart.expressCost.expressPrice;
                    }
                }
            }
        });
        // this.totalPrice = this.fare + this.payment;
        this.data.carts.length <= 0 ? wx.removeStorageSync('choosedCoupon') : null;
        let coupon = this.data.choosedCoupon && this.data.choosedCoupon !== -1 ? this.data.choosedCoupon.coupon.amount : 0
        this.setData({
            goodsPrice: goodsPrice,
            payment: payment,
            totalPrice: fare + payment - coupon,
            fare: fare
        })
    },
    /**
     * 到提交订单页面
     */
    toSubmitOrder() {
        let orderCar = [];
        let carts = this.data.carts;
        if (!carts || carts.length <= 0) {
            return;
        }
        carts.forEach(cartBrand => {
            if (cartBrand.cartListDtos) {
                let brandItems = [];
                cartBrand.cartListDtos.forEach(cartItem => {
                    if (cartItem.choose && cartItem.available) {
                        brandItems.push({
                            cartId: cartItem.cartId,
                            normalPic: cartItem.normalPic,
                            name: cartItem.productName,
                            descr: cartItem.productDescribe,
                            number: cartItem.number,
                            minPrice: cartItem.presentPrice
                        });
                    }
                })
                if (brandItems.length > 0) {
                    orderCar.push({
                        brandId: cartBrand.brandId,
                        brandName: cartBrand.brandName,
                        expressCost: cartBrand.expressCost,
                        cartListDtos: brandItems
                    })
                }
            }
        })
        if (orderCar.length <= 0) {
            return;
        }

        let currentTime = new Date().getTime();
       let products = {
            cart: orderCar,
            totalFare: this.data.fare,
            coupon: this.data.choosedCoupon && this.data.choosedCoupon !== -1 ? this.data.choosedCoupon.coupon.amount : 0,
            goodsPrice: this.data.goodsPrice
       };
        wx.setStorageSync(
            "products",
            JSON.stringify(products)
        );
        this.setData({
            carts: carts
        })
        wx.navigateTo({
            url: '../group/confirmCart/confirmCart?cartsKey=products_' + currentTime
        })
    },
    toCoupon () {
        let carts = [];
        this.data.carts.forEach(c => {
            if (c.cartListDtos.length > 0) {
                c.cartListDtos.forEach(o => {
                    carts.push(o);
                })
            }
        })
        let cartCoupon = {
            carts: carts,
            totalPrice: (this.data.goodsPrice - this.data.fare)
        }
        wx.setStorageSync(
            "cartCoupon",
            JSON.stringify(cartCoupon)
        );
        wx.navigateTo({
            url: '../profile/coupon/coupon?path=cart'
        })
    },
    /**
     * 添加或删除购物车商品数量
     */
    addNumber(e) {
        let cart = e.currentTarget.dataset.cart;
        let number = e.currentTarget.dataset.number;
        if (cart.number <= 1 && number < 0) {
            this.deleteCart(cart);
            return;
        }
        if (number < 0 && !cart.isShow) {
            this.deleteCart(cart);
            return;
        }
        util.request(api.updateCart + cart.cartId,{
            number: number
        }, 'PUT').then(res => {
            if (res.errno == 0) {
                cart.number = cart.number + number;

                if (cart.stock - cart.number < 0 || !cart.isShow) {
                    cart.available = false;
                } else {
                    cart.available = true;
                }
                this.loadCarts();
                this.reComputePrice();
            }
        });
    },
    /**
     * 删除购物车
     */
    deleteCart(cart) {
        let cartItem = cart;
        let carts = this.data.carts;
        util.request(api.deleteCart + cartItem.cartId, {}, 'DELETE').then(res => {
            if (res.errno === 0) {
                var needDeleteBrandCart = null;
                carts.forEach(brandCart => {
                    if (cartItem.brandId === brandCart.brandId) {
                        brandCart.cartListDtos.splice(brandCart.cartListDtos.indexOf(cartItem), 1);
                        if (brandCart.cartListDtos.length === 0) {
                            needDeleteBrandCart = brandCart;
                        }
                    }
                })

                if (needDeleteBrandCart) {
                    carts.splice(carts.indexOf(needDeleteBrandCart), 1);
                }

                this.reComputePrice();
                this.setData({
                    carts: carts
                })
            }
        });
    }
})
