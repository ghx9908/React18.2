import { HostRoot } from "./ReactWorkTags"
const concurrentQueues = []
let concurrentQueuesIndex = 0

/**
 * 把更新先缓存到concurrentQueues数组中
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update, lane) {
  //012 setNumber1 345 setNumber2 678 setNumber3
  concurrentQueues[concurrentQueuesIndex++] = fiber //函数组件对应的fiber
  concurrentQueues[concurrentQueuesIndex++] = queue //要更新的hook对应的更新队列
  concurrentQueues[concurrentQueuesIndex++] = update //更新对象
  concurrentQueues[concurrentQueuesIndex++] = lane //更新对应的赛道
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex //9 只是一边界条件
  concurrentQueuesIndex = 0
  let i = 0
  while (i < endIndex) {
    const fiber = concurrentQueues[i++]
    const queue = concurrentQueues[i++]
    const update = concurrentQueues[i++]
    const lane = concurrentQueues[i++]
    if (queue !== null && update !== null) {
      const pending = queue.pending
      if (pending === null) {
        update.next = update
      } else {
        update.next = pending.next
        pending.next = update
      }
      queue.pending = update
    }
  }
}

/**
 * 把更新队列添加到更新队列中
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update, lane)
  return getRootForUpdatedFiber(fiber)
}
/**
 * 把更新入队
 * @param {*} fiber 入队的fiber 根fiber
 * @param {*} queue shareQueue 待生效的队列
 * @param {*} update 更新
 * @param {*} lane 此更新的车道
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane)
  return getRootForUpdatedFiber(fiber)
}
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber
  let parent = node.return
  while (parent !== null) {
    node = parent
    parent = node.return
  }
  return node.tag === HostRoot ? node.stateNode : null //FiberRootNode div#root
}

// export function markUpdateLaneFromFiberToRoot(sourceFiber) {
//   let node = sourceFiber
//   let parent = sourceFiber.return
//   while (parent !== null) {
//     node = parent
//     parent = parent.return
//   }
//   if (node.tag === HostRoot) {
//     const root = node.stateNode
//     return root
//   }
//   return null
// }
