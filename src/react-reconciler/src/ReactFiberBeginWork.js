import logger from "shared/logger"
/**
 * 目标是根据新虚拟DOM构建新的fiber子链表 child .sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber h1
 * @returns
 */
export function beginWork(current, workInProgress) {
  logger("beginWork", workInProgress)
  return null
}
