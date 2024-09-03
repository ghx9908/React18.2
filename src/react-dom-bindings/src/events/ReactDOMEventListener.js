import getEventTarget from "./getEventTarget"
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree"
import { dispatchEventForPluginEventSystem } from "./DOMPluginEventSystem"
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  setCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities"

/**
 *创建事件监听函数包裹器带优先级
 * @param {*} targetContainer div#root
 * @param {*} domEventName click
 * @param {*} eventSystemFlags 0 4
 * @returns
 */
export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
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
 * 派发离散的事件的的监听函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} container 容器div#root
 * @param {*} nativeEvent 原生的事件
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  //在你是点击按钮的时候，需要设置更新优先级
  //先获取当前老的更新优先级
  const previousPriority = getCurrentUpdatePriority()
  try {
    //把当前的更新优先级设置为离散事件优先级 1
    setCurrentUpdatePriority(DiscreteEventPriority)
    //派发事件
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
  } finally {
    setCurrentUpdatePriority(previousPriority)
  }
}

/**
 * 此方法就是委托给容器的回调，当容器div#root在捕获或者说冒泡阶段处理事件的时候会执行此函数
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0 冒泡 4 捕获
 * @param {*} targetContainer 容器div#root
 * @param {*} nativeEvent 原生的事件
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
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

/**
 * 通过类型获取事件优先级
 * @param {*} domEventName 事件的名称  click
 */
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    // Used by polyfills:
    // eslint-disable-next-line no-fallthrough
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
      return DiscreteEventPriority //1 离散事件
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return ContinuousEventPriority //4 连续事件
    default:
      return DefaultEventPriority //16
  }
}
