module.exports = {
  /**
   * input双向数据绑定
   * 组件中使用 bindinput = "updateValue" 绑定方法
   * 组件中使用 data-name = "变量名称" 传递改变的数据
   */
  updateValue(e) {

    let name = e.currentTarget.dataset.name;

    let nameMap = {}
    nameMap[name] = e.detail && e.detail.value

    this.setData(nameMap)

  }

}