/**
 * 设置除children styles的其他属性 node.setAttribute(name, value)
 * @param {*} node 真实dom节点
 * @param {*} name 属性名
 * @param {*} value 属性值
 */
export function setValueForProperty(node, name, value) {
  if (value === null) {
    node.removeAttribute(name)
  } else {
    node.setAttribute(name, value)
  }
}
