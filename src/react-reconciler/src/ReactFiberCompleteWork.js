import logger, { indent } from "shared/logger"
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags"
import { NoFlags, Update } from "./ReactFiberFlags"

import { createTextInstance } from "react-dom-bindings/src/client/ReactDOMHostConfig"
/**
 * 完成一个fiber节点 创建真实dom节点 fiber.stateNode, fiber.fibersubtreeFlags fiber.flags赋值
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建的fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2
  logger(" ".repeat(indent.number) + "completeWork", workInProgress)
  const newProps = workInProgress.pendingProps
  switch (workInProgress.tag) {
    case HostText: //6
      //如果完成的fiber是文本节点，那就创建真实的文本节点
      const newText = newProps
      //创建真实的DOM节点并传入stateNode
      workInProgress.stateNode = createTextInstance(newText)
      // 向上冒泡属性,将子节点的副作用挂载到自己身上  fiber.subtreeFlags = subtreeFlags;
      bubbleProperties(workInProgress)
      break
  }
}
/**
 *  向上冒泡属性,将子节点的副作用挂载到自己身上  fiber.subtreeFlags = subtreeFlags;
 * @param {*} completedWork  新的构建的fiber
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags
  //遍历当前fiber的所有子节点，把所有的子节的副作用，以及子节点的子节点的副作用全部合并
  let child = completedWork.child
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags
    child = child.sibling
  }
  completedWork.subtreeFlags = subtreeFlags
}
