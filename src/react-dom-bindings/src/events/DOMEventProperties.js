import { registerTwoPhaseEvent } from "./EventRegistry"
//简单事件插件事件名
export const topLevelEventsToReactNames = new Map()

const simpleEventPluginEvents = ["click"]
/**
 * 注册事件
 * @param {*} domEventName [click]
 * @param {*} reactName onClick
 */
function registerSimpleEvent(domEventName, reactName) {
  //onClick在哪里可以取到
  //workInProgress.pendingProps=React元素或者说虚拟DOM.props
  //const newProps = workInProgress.pendingProps;
  //在源码里 让真实DOM元素   updateFiberProps(domElement, props);
  //const internalPropsKey = "__reactProps$" + randomKey;
  //真实DOM元素[internalPropsKey] = props; props.onClick
  //把原生事件名和处理函数的名字进行映射或者说绑定，click=>onClick
  topLevelEventsToReactNames.set(domEventName, reactName)
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
