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
import { completeWork } from "./ReactFiberCompleteWork"
import {
  NoFlags,
  MutationMask,
  Placement,
  Update,
  ChildDeletion,
  Passive,
} from "./ReactFiberFlags"
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
  includesBlockingLane,
} from "./ReactFiberLane"
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  setCurrentUpdatePriority,
} from "./ReactEventPriorities"
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig"
import {
  scheduleSyncCallback,
  flushSyncCallbacks,
} from "./ReactFiberSyncTaskQueue"

let workInProgress = null
let workInProgressRoot = null //正在构建中的根节点
let rootDoesHavePassiveEffect = false //此根节点上有没有useEffect类似的副作用
let rootWithPendingPassiveEffects = null //具有useEffect副作用的根节点 FiberRootNode,根fiber.stateNode
let workInProgressRootRenderLanes = NoLanes

//构建fiber树正在进行中
const RootInProgress = 0
//构建fiber树已经完成
const RootCompleted = 5
//当渲染工作结束的时候当前的fiber树处于什么状态,默认进行中
let workInProgressRootExitStatus = RootInProgress

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
  //如果没有要执行的任务
  if (nextLanes === NoLanes) {
    return
  }
  //获取新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes) //16
  //新的回调任务
  let newCallbackNode
  //如果新的优先级是同步的话
  if (newCallbackPriority === SyncLane) {
    //先把performSyncWorkOnRoot添回到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    //再把flushSyncCallbacks放入微任务
    queueMicrotask(flushSyncCallbacks)
    //如果是同步执行的话
    newCallbackNode = null
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
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }
  //在根节点的执行的任务是newCallbackNode
  root.callbackNode = newCallbackNode
  /*  if (workInProgressRoot) return;
   workInProgressRoot = root;
   //告诉 浏览器要执行performConcurrentWorkOnRoot 在此触发更新
   scheduleCallback(NormalSchedulerPriority, performConcurrentWorkOnRoot.bind(null, root)); */
}
/**
 * 在根上执行同步工作
 */
function performSyncWorkOnRoot(root) {
  //获得最高优的lane
  const lanes = getNextLanes(root)
  //渲染新的fiber树
  renderRootSync(root, lanes)
  //获取新渲染完成的fiber根节点
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
  return null
}
/**
 * 根据fiber构建fiber树,要创建真实的DOM节点，还需要把真实的DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  console.log("performConcurrentWorkOnRoot")
  //先获取当前根节点上的任务
  const originalCallbackNode = root.callbackNode
  //获取当前优先级最高的车道
  const lanes = getNextLanes(root, NoLanes) //16
  if (lanes === NoLanes) {
    return null
  }
  //如果不包含阻塞的车道，并且没有超时，就可以并行渲染,就是启用时间分片
  //所以说默认更新车道是同步的,不能启用时间分片
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout
  console.log("shouldTimeSlice", shouldTimeSlice)
  //执行渲染，得到退出的状态
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes)
  //如果不是渲染中的话，那说明肯定渲染完了
  if (exitStatus !== RootInProgress) {
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    commitRoot(root)
  }
  //说明任务没有完成
  if (root.callbackNode === originalCallbackNode) {
    //把此函数返回，下次接着干
    return performConcurrentWorkOnRoot.bind(null, root)
  }
  return null
}
function renderRootConcurrent(root, lanes) {
  //因为在构建fiber树的过程中，此方法会反复进入，会进入多次
  //只有在第一次进来的时候会创建新的fiber树，或者说新fiber
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes)
  }
  //在当前分配的时间片(5ms)内执行fiber树的构建或者说渲染，
  workLoopConcurrent()
  //如果 workInProgress不为null，说明fiber树的构建还没有完成
  if (workInProgress !== null) {
    return RootInProgress
  }
  //如果workInProgress是null了说明渲染工作完全结束了
  return workInProgressRootExitStatus
}
function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects
    //执行卸载副作用，destroy
    commitPassiveUnmountEffects(root.current)
    //执行挂载副作用 create
    commitPassiveMountEffects(root, root.current)
  }
}
function commitRoot(root) {
  const previousUpdatePriority = getCurrentUpdatePriority()
  try {
    //把当前的更新优先级设置为1
    setCurrentUpdatePriority(DiscreteEventPriority)
    commitRootImpl(root)
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority)
  }
}
function commitRootImpl(root) {
  //先获取新的构建好的fiber树的根fiber tag=3
  const { finishedWork } = root
  workInProgressRoot = null
  workInProgressRootRenderLanes = null
  root.callbackNode = null
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true
      Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect)
    }
  }
  //判断子树有没有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags
  //如果自己的副作用或者子节点有副作用就进行提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    //当DOM执行变更之后
    commitMutationEffectsOnFiber(finishedWork, root)
    //执行layout Effect
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
  workInProgress = createWorkInProgress(root.current, null)
  workInProgressRootRenderLanes = renderLanes
  workInProgressRoot = root
  finishQueueingConcurrentUpdates()
}
function renderRootSync(root, renderLanes) {
  //如果新的根和老的根不一样，或者新的渲染优先级和老的渲染优先级不一样
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    prepareFreshStack(root, renderLanes)
  }
  workLoopSync()
}
function workLoopConcurrent() {
  //如果有下一个要构建的fiber并且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    console.log("shouldYield()", shouldYield(), workInProgress)
    sleep(6)
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
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes)
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
    const current = completedWork.alternate
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
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted
  }
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority()
  if (updateLane !== NoLanes) {
    return updateLane
  }
  const eventLane = getCurrentEventPriority()
  return eventLane
}
function sleep(duration) {
  const timeStamp = new Date().getTime()
  const endTime = timeStamp + duration
  while (true) {
    if (new Date().getTime() > endTime) {
      return
    }
  }
}
