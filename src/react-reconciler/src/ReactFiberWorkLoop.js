import {
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "./scheduler"
import { createWorkInProgress } from "./ReactFiber"
import { beginWork } from "./ReactFiberBeginWork"
import {
  NoFlags,
  MutationMask,
  Placement,
  Update,
  ChildDeletion,
  Passive,
} from "./ReactFiberFlags"

import { completeWork } from "./ReactFiberCompleteWork"
import {
  commitMutationEffectsOnFiber, //执行DOM操作
  commitPassiveUnmountEffects, //执行destroy
  commitPassiveMountEffects, //执行create
  commitLayoutEffects,
} from "./ReactFiberCommitWork"
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags"
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates"

import {
  NoLanes,
  markRootUpdated,
  getNextLanes,
  getHighestPriorityLane,
  SyncLane,
} from "./ReactFiberLane"
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
} from "./ReactEventPriorities"
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig"

let workInProgress = null
let workInProgressRoot = null //正在构建中的根节点
let rootDoesHavePassiveEffect = false //此根节点上有没有useEffect类似的副作用
let rootWithPendingPassiveEffects = null //具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let workInProgressRenderLanes = NoLanes

/**
 * 计划更新root
 * 源码中此处有一个任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane)
  //确保调度执行root上的更新
  ensureRootIsScheduled(root)
}
function ensureRootIsScheduled(root) {
  //获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes) //16
  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes) //16
  //如果新的优先级是同步的话
  if (newCallbackPriority === SyncLane) {
    // TODO
  } else {
    //如果不是同步，就需要调度一个新的任务
    let schedulerPriorityLevel
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority
        break
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority
        break
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority
        break
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority
        break
      default:
        schedulerPriorityLevel = NormalSchedulerPriority
        break
    }
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }
  // if (workInProgressRoot) return
  // workInProgressRoot = root
  // //告诉 浏览器要执行performConcurrentWorkOnRoot 在此触发更新
  // scheduleCallback(
  //   NormalSchedulerPriority,
  //   performConcurrentWorkOnRoot.bind(null, root)
  // )
}
/**
 * 根据fiber构建fiber树,要创建真实的DOM节点，还需要把真实的DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, timeout) {
  //获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes) //16
  if (nextLanes === NoLanes) {
    return null
  }
  //第一次渲染以同步的方式渲染根节点，初次渲染的时候，都是同步
  renderRootSync(root, nextLanes)
  //开始进入提交 阶段，就是执行副作用，修改真实DOM
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
  return null
}
/**
 * 刷新副作用
 */
function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects
    //执行卸载副作用，destroy
    commitPassiveUnmountEffects(root.current)
    //执行挂载副作用 create
    commitPassiveMountEffects(root, root.current)
  }
}
/**
 * 等DOM变更后，就可以把让root的current指向新的fiber树
 * @param {*} root RootFiberNode
 */
function commitRoot(root) {
  //先获取新的构建好的fiber树的根fiber tag=3
  const { finishedWork } = root
  workInProgressRoot = null
  workInProgressRenderLanes = null
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true //表明根上有要执行的副作用
      //刷新副作用
      scheduleCallback(NormalSchedulerPriority, flushPassiveEffect)
    }
  }
  printFinishedWork(finishedWork)
  //判断子树有没有副作用 更新或者插入
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  //判断根fiber自己有没有副作用 更新或者插入
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    //当DOM执行变更之后
    //提交变更操作的副作用在fiber上 执行销毁的LayoutEffects
    commitMutationEffectsOnFiber(finishedWork, root)
    //执行LayoutEffects
    commitLayoutEffects(finishedWork, root)
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false
      rootWithPendingPassiveEffects = root
    }
  }
  //等DOM变更后，就可以把让root的current指向新的fiber树
  root.current = finishedWork
}

function prepareFreshStack(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRenderLanes !== renderLanes
  ) {
    workInProgress = createWorkInProgress(root.current, null)
  }
  workInProgressRenderLanes = renderLanes
  workInProgressRoot = root
  finishQueueingConcurrentUpdates()
}
function renderRootSync(root, renderLanes) {
  //开始构建fiber树
  prepareFreshStack(root, renderLanes)
  workLoopSync()
}
function workLoopConcurrent() {
  //如果有下一个要构建的fiber并且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
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
  const next = beginWork(current, unitOfWork, workInProgressRenderLanes)
  //返回新创建的第一个子fiber
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
    //完成一个fiber节点 创建真实dom节点 fiber.stateNode, fiber.fibersubtreeFlags fiber.flags赋值
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
function printFinishedWork(fiber) {
  const { flags, deletions } = fiber
  if ((flags & ChildDeletion) !== NoFlags) {
    fiber.flags &= ~ChildDeletion
    console.log(
      "子节点有删除" +
        deletions
          .map((fiber) => `${fiber.type}#${fiber.memoizedProps.id}`)
          .join(",")
    )
  }
  let child = fiber.child
  while (child) {
    printFinishedWork(child)
    child = child.sibling
  }

  if (fiber.flags !== NoFlags) {
    console.log(
      getFlags(fiber),
      getTag(fiber.tag),
      typeof fiber.type === "function" ? fiber.type.name : fiber.type,
      fiber.memoizedProps
    )
  }
}

function getFlags(fiber) {
  const { flags } = fiber
  if (flags === (Update | Placement | ChildDeletion)) {
    return `自己移动和子元素有删除`
  }
  if (flags === (ChildDeletion | Update)) {
    return `自己有更新和子元素有删除`
  }
  if (flags === ChildDeletion) {
    return `子元素有删除`
  }
  if (flags === (Placement | Update)) {
    return `移动并更新`
  }
  if (flags === Placement) {
    return `插入`
  }
  if (flags === Update) {
    return `更新`
  }
  return flags
}

function getTag(tag) {
  switch (tag) {
    case FunctionComponent:
      return "FunctionComponent"
    case HostRoot:
      return "HostRoot"
    case HostComponent:
      return "HostComponent"
    case HostText:
      return "HostText"
    default:
      return tag
  }
}

export function requestUpdateLane() {
  //获取当前的跟新优先级
  const updateLane = getCurrentUpdatePriority()
  if (updateLane !== NoLanes) {
    //不等于0则取更新优先级
    return updateLane
  }
  //获取当前的事件有优先级
  const eventLane = getCurrentEventPriority()
  return eventLane
}
