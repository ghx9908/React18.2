//简单事件插件
import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties"
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem"
import { IS_CAPTURE_PHASE } from "../EventSystemFlags"
import { SyntheticMouseEvent } from "../SyntheticEvent"

/**
 * 把要执行回调函数添加到dispatchQueue中
 * @param {*} dispatchQueue 派发队列，里面放置我们的监听函数
 * @param {*} domEventName DOM事件名 click
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags  事件系统标题 0 表示冒泡 4表示捕获
 * @param {*} targetContainer  目标容器 div#root
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget, //click => onClick
  eventSystemFlags,
  targetContainer
) {
  const reactName = topLevelEventsToReactNames.get(domEventName) //click=>onClick
  let SyntheticEventCtor //合成事件的构建函数

  switch (domEventName) {
    case "click":
      SyntheticEventCtor = SyntheticMouseEvent //合成鼠标事件
      break
    default:
      break
  }
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0 //是否是捕获阶段
  // 累加单阶段监听
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  )
  //如果有要执行的监听函数的话[onClickCapture,onClickCapture]=[ChildCapture,ParentCapture]
  if (listeners.length > 0) {
    //创建合成事件实例
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget
    )
    dispatchQueue.push({
      event, //合成事件实例
      listeners, //监听函数数组
    })
  }
}

export { registerSimpleEvents as registerEvents, extractEvents }
