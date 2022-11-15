import logger, { indent } from "shared/logger"

/**
 * 完成一个fiber节点
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建的fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2
  logger(" ".repeat(indent.number) + "completeWork", workInProgress)
}
