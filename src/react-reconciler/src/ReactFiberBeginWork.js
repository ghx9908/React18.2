import logger, { indent } from "shared/logger"
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue"
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber"
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig"
import {
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent,
  FunctionComponent,
} from "./ReactWorkTags"

/**
 * 根据新的虚拟DOM生成新的Fiber链表   workInProgress.child = 新创建的第一个子fiber
 * @param {*} current 老的父Fiber
 * @param {*} workInProgress 新的你Fiber
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  //如果此fiber没有对应的老fiber,说明此fiber是新创建的，如果这个父fiber是新的创建的，它的儿子们也肯定都是新创建的
  if (current === null) {
    // 父fiber的child指向第一个子fiber
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren) //创建子fiber链表并返回第一个子fiber
  } else {
    //如果说有老Fiber的话，做DOM-DIFF 拿老的子fiber链表和新的子虚拟DOM进行比较 ，进行最小化的更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    )
  }
}
/**
 * 目标是根据新虚拟DOM构建新的fiber子链表
 * @param {*} current
 * @param {*} workInProgress
 * @returns
 */
function updateHostRoot(current, workInProgress) {
  //需要知道它的子虚拟DOM，知道它的儿子的虚拟DOM信息
  processUpdateQueue(workInProgress) //workInProgress.memoizedState={ element }
  const nextState = workInProgress.memoizedState
  //nextChildren就是新的子虚拟DOM
  const nextChildren = nextState.element //h1
  //根据新的虚拟DOM生成子fiber链表
  //协调子节点 Dom-diff
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child //{tag:5,type:'h1'}
}

/**
 * 构建原生组件的子fiber链表
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber h1
 * @return 新创建的第一个子fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress //h1
  const nextProps = workInProgress.pendingProps //{children:['hello',{$$typeof: Symbol(react.element),type:span }]}
  let nextChildren = nextProps.children //['hello',{$$typeof: Symbol(react.element),type:span }]
  //判断当前虚拟DOM它的儿子是不是一个文本独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps) //判断孩子是否是一个字符串或者数字
  if (isDirectTextChild) {
    nextChildren = null
  }
  //根据新的虚拟DOM生成新的Fiber链表
  reconcileChildren(current, workInProgress, nextChildren) // workInProgress.child = 新创建的第一个子fiber
  return workInProgress.child
}
/**
 * 目标是根据新虚拟DOM构建新的fiber子链表 child .sibling
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber h1
 * @returns 新创建的第一个子fiber
 */
export function beginWork(current, workInProgress) {
  indent.number += 2
  logger(" ".repeat(indent.number) + "beginWork", workInProgress)

  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent: //原生dom节点
      return updateHostComponent(current, workInProgress) //新创建的第一个子fiber
    case HostText:
      return null
    default:
      return null
  }
}
