//简单事件插件
import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties"
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem"
import { IS_CAPTURE_PHASE } from "../EventSystemFlags"

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget, //click => onClick
  eventSystemFlags,
  targetContainer
) {
  const reactName = topLevelEventsToReactNames.get(domEventName)
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0
  // 累加单阶段监听
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  )
  console.log(eventSystemFlags, listeners)
}

export { registerSimpleEvents as registerEvents, extractEvents }
