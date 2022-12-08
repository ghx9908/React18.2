const randomKey = Math.random().toString(36).slice(2)
const internalInstanceKey = "__reactFiber$" + randomKey
const internalPropsKey = "__reactProps$" + randomKey
/**
 * 从真实的DOM节点上获取它对应的fiber节点
 * @param {*} targetNode span
 * @return  对应的fiber实例
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey]
  if (targetInst) {
    return targetInst
  }
  return null
  //如果真实DOM上没有fiber,就不要返回undefined,而是要返回null
}

/**
 * 提前缓存fiber节点的实例到DOM节点上
 * @param {*} hostInst fiber
 * @param {*} node 原生节点
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props
}
// 获取props
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null
}
