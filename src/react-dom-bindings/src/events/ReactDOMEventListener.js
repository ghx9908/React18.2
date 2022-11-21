import getEventTarget from "./getEventTarget"
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree"
import { dispatchEventForPluginEventSystem } from "./DOMPluginEventSystem"

export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  // 派发离散的事件的的监听函数
  const listenerWrapper = dispatchDiscreteEvent //
  return listenerWrapper.bind(
    null,
    domEventName, //事件名 click
    eventSystemFlags, //阶段 0 冒泡 4 捕获
    targetContainer //容器div#root
  )
}

/**
 * 派发离散的事件的的监听函数 不联系
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器div#root
 * @param {*} nativeEvent 原生的事件
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  //派发事件
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
}

/**
 * 此方法就是委托给容器的回调，当容器#root在捕获或者说冒泡阶段处理事件的时候会执行此函数
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} container
 * @param {*} nativeEvent
 */
export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  //获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent)
  //从真实的DOM节点上获取它对应的fiber实例
  const targetInst = getClosestInstanceFromNode(nativeEventTarget)
  //派发事件为插件事件系统
  dispatchEventForPluginEventSystem(
    domEventName, //click
    eventSystemFlags, //0 4
    nativeEvent, //原生事件
    targetInst, //此真实DOM对应的fiber
    targetContainer //目标容器
  )
}
