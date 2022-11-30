/**
 *获取事件源，它是一个真实DOM
 * @param {*} nativeEvent 原生的事件 e
 * @returns 获取事件源，它是一个真实DOM nativeEvent.target
 */
function getEventTarget(nativeEvent) {
  //做兼容处理
  const target = nativeEvent.target || nativeEvent.srcElement || window //span
  return target
}
export default getEventTarget
