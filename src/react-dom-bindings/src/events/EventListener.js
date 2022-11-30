/**
 *
 * @param {*} target div#root
 * @param {*} eventType click
 * @param {*} listener
 * @returns
 */
export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true)
  return listener
}
export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, false)
  return listener
}
