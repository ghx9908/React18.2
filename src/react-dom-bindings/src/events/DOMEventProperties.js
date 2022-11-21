import { registerTwoPhaseEvent } from "./EventRegistry"
//简单事件插件事件名
const simpleEventPluginEvents = ["click"]
/**
 * 注册事件
 * @param {*} domEventName [click]
 * @param {*} reactName onClick
 */
function registerSimpleEvent(domEventName, reactName) {
  // 注册两个阶段的事件
  registerTwoPhaseEvent(reactName, [domEventName]) //onClick [onClick]
}
/**
 * 注册简单事件
 */
export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i] // click
    const domEventName = eventName.toLowerCase() // click
    const capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1) // Click
    // 开始注册简单事件
    registerSimpleEvent(domEventName, `on${capitalizedEvent}`) // click=>onClick
  }
}
