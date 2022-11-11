import { scheduleCallback } from "scheduler"
import { createWorkInProgress } from "./ReactFiber"
import { beginWork } from "./ReactFiberBeginWork"
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
  console.log("workInProgress=>", workInProgress)
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
  console.log("next=>", next)
  //等待生效的变成已生效的
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if (next === null) {
    //如果没有子节点表示当前的fiber已经完成了
    workInProgress = null
    // completeUnitOfWork(unitOfWork)
  } else {
    //如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next
  }
}
