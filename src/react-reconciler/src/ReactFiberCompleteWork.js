import logger, { indent } from "shared/logger"
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags"
import { NoFlags, Update } from "./ReactFiberFlags"

import {
  createTextInstance,
  createInstance,
  finalizeInitialChildren,
  appendInitialChild,
} from "react-dom-bindings/src/client/ReactDOMHostConfig"
/**
 * 把当前的完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实DOM节点上
 * @param {*} parent 当前完成的fiber真实的DOM节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child //获取子fiber
  while (node) {
    //如果子节点类型是一个原生节点或者是一个文节本点
    if (node.tag === HostComponent || node.tag === HostText) {
      //子dom节点插入到父dom节点上
      appendInitialChild(parent, node.stateNode)
      //如果第一个儿子不是一个原生节点，说明它可能是一个函数组件
    } else if (node.child !== null) {
      node = node.child
      continue
    }
    if (node === workInProgress) {
      return
    }
    //如果当前的节点没有弟弟
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return
      }
      //回到父节点
      node = node.return
    }
    node = node.sibling
  }
}

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
    case HostComponent: // 5如果完成的是原生节点的话
      ///现在只是在处理创建或者说挂载新节点的逻辑，后面此处分进行区分是初次挂载还是更新
      //创建真实的DOM节点
      const { type } = workInProgress //span
      //创建真实DOM节点并且返回
      const instance = createInstance(type, newProps, workInProgress) //新创建的真实dom节点
      //把自己所有的儿子都添加到自己的身上

      appendAllChildren(instance, workInProgress) //span 没有子fiber
      //创建真实的DOM节点并传入stateNode
      workInProgress.stateNode = instance
      // 把 workInProgress.pendingProps 内容挂载到dom上
      // node.style.color = red node.textContent = text node.setAttribute(name, value)
      finalizeInitialChildren(instance, type, newProps)
      // 向上冒泡属性,将子节点的副作用挂载到自己身上  fiber.subtreeFlags = subtreeFlags;
      bubbleProperties(workInProgress)
      break
    case HostText: //6 文本节点
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
