import {
  setInitialProperties,
  diffProperties,
  updateProperties,
} from "./ReactDOMComponent"
import { precacheFiberNode, updateFiberProps } from "./ReactDOMComponentTree"
import { DefaultEventPriority } from "react-reconciler/src/ReactEventPriorities"
import { getEventPriority } from "../events/ReactDOMEventListener"

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
 * 在原生组件初次挂载的时候，会通过此方法创建真实DOM
 * @param {*} type 类型 span
 * @param {*} props 属性
 * @param {*} internalInstanceHandle 它对应的fiber
 * @returns
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type)
  //预先缓存fiber节点到DOM元素上
  precacheFiberNode(internalInstanceHandle, domElement)
  //把属性直接保存在domElement的属性上
  updateFiberProps(domElement, props)

  return domElement
}
/**
 * 子dom节点插入到父dom节点上
 * @param {*} parent 父真实dom节点
 * @param {*} child 子真实dom节点
 */
export function appendInitialChild(parent, child) {
  parent.appendChild(child)
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

/**
 * 把子dom插入到父dom节点
 * @param {*} parentInstance
 * @param {*} child
 */
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child)
}

/**
 * 在某一节点前面插入新的节点
 * @param {*} parentInstance 父节点
 * @param {*} child  被插入的节点
 * @param {*} beforeChild 要插入到谁的前面
 */
export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild)
}
export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps)
}

export function commitUpdate(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps
) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps)
  updateFiberProps(domElement, newProps)
}

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child)
}
/**
 * 获取事件优先级
 * @returns
 */
export function getCurrentEventPriority() {
  const currentEvent = window.event
  if (currentEvent === undefined) {
    //当前没有任何事件 返回默认事件优先级
    return DefaultEventPriority //16 初次渲染16
  }
  return getEventPriority(currentEvent.type)
}
