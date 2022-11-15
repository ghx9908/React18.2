import { scheduleCallback } from "scheduler"
import { createWorkInProgress } from "./ReactFiber"
import { beginWork } from "./ReactFiberBeginWork"
import { completeWork } from "./ReactFiberCompleteWork"
/**
 * 计划更新root
 * 源码中此处有一个任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  //确保调度执行root上的更新
  ensureRootIsScheduled(root)
}
function ensureRootIsScheduled(root) {
  //告诉 浏览器要执行performConcurrentWorkOnRoot 在此触发更新
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root))
}
/**
 * 根据fiber构建fiber树,要创建真实的DOM节点，还需要把真实的DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  //第一次一同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root)
}

let workInProgress = null
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
}
function renderRootSync(root) {
  //开始构建fiber树
  prepareFreshStack(root)
  //开始构建子节点
  workLoopSync()
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}
/**
 * 执行一个工作单元
 * @param {*} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  //获取新的fiber对应的老fiber
  const current = unitOfWork.alternate
  //完成当前fiber的子fiber链表构建后
  const next = beginWork(current, unitOfWork)
  //等待生效的变成已生效的
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    completeUnitOfWork(unitOfWork)
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next
  }
}
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork
  do {
    //老fiber
    const current = completedWork.alternate
    //父fiber
    const returnFiber = completedWork.return
    //执行此fiber 的完成工作,如果是原生组件的话就是创建真实的DOM节点
    completeWork(current, completedWork)
    //如果有弟弟，就构建弟弟对应的fiber子链表
    const siblingFiber = completedWork.sibling
    if (siblingFiber !== null) {
      workInProgress = siblingFiber
      return
    }
    //如果没有弟弟，说明这当前完成的就是父fiber的最后一个节点
    //也就是说一个父fiber,所有的子fiber全部完成了
    completedWork = returnFiber
    workInProgress = completedWork
  } while (completedWork !== null)
  //如果走到了这里，说明整个fiber树全部构建完毕,把构建状态设置为空成
  // if (workInProgressRootExitStatus === RootInProgress) {
  //   workInProgressRootExitStatus = RootCompleted
  // }
}
