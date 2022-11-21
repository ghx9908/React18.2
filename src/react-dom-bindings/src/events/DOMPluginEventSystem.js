import { allNativeEvents } from "./EventRegistry"

import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin"

// 注册简单事件 入口
SimpleEventPlugin.registerEvents()
/**
 * 监听所有真实的事件
 * @param {*} rootContainerElement FiberRootNode
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  // 遍历所有的原生的事件比如click,进行监听
  allNativeEvents.forEach((domEventName) => {
    console.log("domEventName", domEventName)
  })
}
