import { setInitialProperties } from "./ReactDOMComponent"

/**
 *  判断当前虚拟DOM它的儿子是不是一个文本独生子
 * @param {*} type h1
 * @param {*} props {children:['hello',{$$typeof: Symbol(react.element),type:span }]}
 * @returns
 */
export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === "string" || typeof props.children === "number"
  )
}

/**
 * 创建文本dom节点
 * @param {*} content 文本内容
 * @returns 真实文本dom节点
 */
export function createTextInstance(content) {
  return document.createTextNode(content)
}

/**
 * 创建文本dom节点
 * @param {*} type 标签
 * @returns 真实dom节点
 */
export function createInstance(type) {
  const domElement = document.createElement(type)
  //updateFiberProps(domElement, props);
  return domElement
}

/**
 * 把 workInProgress.pendingProps 内容挂载到dom上
 * node.style.color = red node.textContent = text node.setAttribute(name, value)
 * @param {*} domElement 新创建的真实dom节点
 * @param {*} type  span
 * @param {*} props workInProgress.pendingProps 待生效的属性
 */
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props)
}
