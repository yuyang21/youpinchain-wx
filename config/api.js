module.exports = {
  homeIndex: '/home/index', //首页数据接口
  AuthLoginByWeixin: '/oa/login_oa', //微信授权登陆
  groupList: '/groups', //拼团列表
  groupDet: '/groups/', //根据拼团id查询商品详情
  userInfo: '/oa/users/info', //用户信息
  orderStat: '/orders/stat', //订单统计
  getDefaultAddress: '/addresses/defaultAddress', //地址列表查询
  getAddressList: '/addresses', //地址列表查询
  getRegionsList: '/regions', //查询区域
  getOrderList: '/orders', // 获取订单列表 showType 0:全部，1：待付款，2：待发货，3：待收货，4：待评价
  systemTime: '/system/time' //获取系统时间
};