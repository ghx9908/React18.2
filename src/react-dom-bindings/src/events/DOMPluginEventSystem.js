import { allNativeEvents } from "./EventRegistry"
import { IS_CAPTURE_PHASE } from "./EventSystemFlags.js"

import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin"
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener"
import {
  addEventCaptureListener,
  addEventBubbleListener,
} from "./EventListener"
const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2)

// 注册简单事件 入口
SimpleEventPlugin.registerEvents()
/**
 * 监听所有真实的事件
 * @param {*} rootContainerElement FiberRootNode
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

  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  )
}

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
    //增加事件的捕获监听
    addEventCaptureListener(targetContainer, domEventName, listener)
  } else {
    //增加事件的冒泡监听
    addEventBubbleListener(targetContainer, domEventName, listener)
  }
}
