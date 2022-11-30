import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponentTree"

/**
 * 获取此fiber上对应的回调函数
 * @param {*} inst fiber
 * @param {*} registrationName // 对应事件的属性名onClickCapture
 * @return 返回对应 onClickCapture 或者 onClick的回调函数
 */
export default function getListener(inst, registrationName) {
  const { stateNode } = inst
  if (stateNode === null) return null
  //从node 节点获取props
  const props = getFiberCurrentPropsFromNode(stateNode)
  if (props === null) return null
  const listener = props[registrationName] //props.onClick
  return listener
}
