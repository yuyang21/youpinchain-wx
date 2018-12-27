module.exports = {
  homeIndex: '/home/index', //首页数据接口
  AuthLoginByWeixin: '/auth/login_by_weixin', //微信授权登陆
  groupList: '/groups', //拼团列表
  groupDet: '/groups/', //根据拼团id查询商品详情
  userInfo: '/oa/users/info', //用户信息
  orderStat: '/orders/stat', //订单统计
  getDefaultAddress: '/addresses/defaultAddress', //地址列表查询
  getAddressList: '/addresses', //地址列表查询
  getRegionsList: '/regions', //查询区域
  getOrderList: '/orders', // 获取订单列表 showType 0:全部，1：待付款，2：待发货，3：待收货，4：待评价
  systemTime: '/system/time', //获取系统时间
  couponList: '/coupon', //我的优惠券查询
  withdraw: '/accounts/0/withdraws', //申请提现
  accountsInfo: '/accounts/0', //我的账户信息
  todayProfit: '/accounts/0/todayProfit', //我的今日收益
  rewardGrade: '/accounts/0/rewardGrade', //我的段位
  rewardGrades: '/rewardGrades', //提成奖励段位信息
  incomeDeals: '/accounts/0/deals', //我的收益明细
  userInvites: '/accounts/0/userInvites', //我的邀请记录
  updateAddress: '/addresses/', //更新收货地址
  addAddress: '/addresses', //添加收货地址
  deleteAddress: '/addresses/', //删除收货地址
  groupSuit: '/groups/', //根据拼团id查询商品详情
  expressCost: '/express/', //运费查询
  inviteCode: '/act/bounty/home/inv', //获取我的分享码
};