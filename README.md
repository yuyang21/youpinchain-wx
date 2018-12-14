# youpinchain-wx

## 配置项

### aap.json 文件配置

#### tabBar 菜单栏

  + 当 postion 为 top 时，不显示 icon。
  + list 接受一个数组，只能配置最少2个、最多5个 tab

```json
{
  "tabBar": {
    "backgroundColor": "tab 的背景色，仅支持十六进制颜色",
    "borderStyle": "tabbar上边框的颜色， 仅支持 black / white(默认black)",
    "selectedColor": "tab 上的文字选中时的颜色，仅支持十六进制颜色",
    "color": "tab 上的文字默认颜色，仅支持十六进制颜色",
    "position": "tabBar的位置，仅支持 bottom / top(默认bottom)",
    "list": {
      /**
       *  pagePath: 页面路径，必须在 pages 中先定义,
       *  iconPath: 图片路径，icon 大小限制为40kb，建议尺寸为 81px * 81px，不支持网络图片。
       *  selectedIconPath: 选中时的图片路径，icon 大小限制为40kb，建议尺寸为 81px * 81px，不支持网络图片。
       *  text: tab 上按钮文字
       */
      "pagePath": "pages/index/index",
      "iconPath": "static/images/tabBar/tab-home-normal.png",
      "selectedIconPath": "static/images/tabBar/tab-home-highlight.png",
      "text": "首页"
    },
    {
      "pagePath": "pages/cart/cart",
      "iconPath": "static/images/tabBar/tab-buy-normal.png",
      "selectedIconPath": "static/images/tabBar/tab-buy-highlight.png",
      "text": "购物车"
    }
  }
}
```
