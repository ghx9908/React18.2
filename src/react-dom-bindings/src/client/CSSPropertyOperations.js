/**
 * 遍历将styles 样式挂在真实dom节点上 node.style.color = red
 * @param {*} node 真实Dom节点
 * @param {*} styles 需要挂载的样式 {color:red}
 */
export function setValueForStyles(node, styles) {
  const { style } = node

  //styles={ color: "red" }
  for (const styleName in styles) {
    if (styles.hasOwnProperty(styleName)) {
      const styleValue = styles[styleName]
      style[styleName] = styleValue
    }
  }
}
