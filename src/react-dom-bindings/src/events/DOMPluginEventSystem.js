import { allNativeEvents } from "./EventRegistry"
import { IS_CAPTURE_PHASE } from "./EventSystemFlags.js"

import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin"
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener"
import {
  addEventCaptureListener,
  addEventBubbleListener,
} from "./EventListener"
import getEventTarget from "./getEventTarget"
import getListener from "./getListener"
import { HostComponent } from "react-reconciler/src/ReactWorkTags"

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2)

// 注册简单事件 入口  给set里面放入事件 map里面做映射
SimpleEventPlugin.registerEvents()
/**
 * 监听所有真实的事件
 * @param {*} rootContainerElement FiberRootNode div#root
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  //监听根容器，也就是div#root只监听一次
  if (!rootContainerElement[listeningMarker]) {
    // 遍历所有的原生的事件比如click,进行监听
    allNativeEvents.forEach((domEventName) => {
      // 注册原生事件 true捕获
      listenToNativeEvent(domEventName, true, rootContainerElement)
      listenToNativeEvent(domEventName, false, rootContainerElement)
    })
  }
}

/**
 * 注册原生事件
 * @param {*} domEventName 原生事件 click
 * @param {*} isCapturePhaseListener 是否是捕获阶段 true false
 * @param {*} target 目标DOM节点 div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target
) {
  let eventSystemFlags = 0 //默认是0指的是冒泡  4是捕获
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE
  }
  //增加捕获事件监听器
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  )
}
/**
 * 增加捕获事件监听器
 * @param {*} targetContainer   目标DOM节点 div#root 容器节点
 * @param {*} domEventName 原生事件 click
 * @param {*} eventSystemFlags 默认是0指的是冒泡  4是捕获
 * @param {*} isCapturePhaseListener  是否是捕获阶段 true false
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  //创建事件监听函数包裹器带优先级
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  )
  if (isCapturePhaseListener) {
    //增加事件的捕获监听 绑定事件
    addEventCaptureListener(targetContainer, domEventName, listener)
  } else {
    //增加事件的冒泡监听
    addEventBubbleListener(targetContainer, domEventName, listener)
  }
}
/**
 *  派发事件为插件事件系统
 * @param {*} domEventName click
 * @param {*} eventSystemFlags 0 4
 * @param {*} nativeEvent 原生事件 e
 * @param {*} targetInst  此真实DOM对应的fiber
 * @param {*} targetContainer div#root
 */
export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  //派发事件为插件
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer
  )
}
/**
 * 派发事件为插件
 * @param {*} domEventName div#root
 * @param {*} eventSystemFlags 0 4
 * @param {*} nativeEvent  原生事件 e
 * @param {*} targetInst 此真实DOM对应的fiber
 * @param {*} targetContainer div#root
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent)
  //派发事件的数组 为了事件冒泡捕获
  const dispatchQueue = []

  //提取事件  把要执行回调函数添加到dispatchQueue中
  extractEvents(
    dispatchQueue, //[]
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  )
  console.log("dispatchQueue", dispatchQueue)
}
/**
 * 提取事件
 * @param {*} dispatchQueue 派发事件的数组 为了事件冒泡捕获 []
 * @param {*} domEventName click
 * @param {*} targetInst fiber
 * @param {*} nativeEvent e
 * @param {*} nativeEventTarget span
 * @param {*} eventSystemFlags 0 4
 * @param {*} targetContainer div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  //把要执行回调函数添加到dispatchQueue中
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  )
}
/**
 * 累加单阶段监听
 * @param {*} targetFiber  fiber
 * @param {*} reactName onClick
 * @param {*} nativeEventType click
 * @param {*} isCapturePhase true  false
 * @returns 返回捕获或者冒泡的事件函数集合
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + "Capture" //onClickCapture
  //捕获还是冒泡
  const reactEventName = isCapturePhase ? captureName : reactName
  const listeners = [] //先放子span 的事件 再放父h1的事件
  let instance = targetFiber
  while (instance !== null) {
    const { stateNode, tag } = instance
    if (tag === HostComponent && stateNode !== null) {
      // 获取对应 onClickCapture 或者 onClick的回调函数
      const listener = getListener(instance, reactEventName)
      if (listener) {
        listeners.push(listener)
      }
    }
    instance = instance.return
  }
  return listeners
}
