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
  console.log(
    "dispatchEvent=>",
    domEventName,
    eventSystemFlags,
    targetContainer,
    nativeEvent
  )
}
