import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates"
import assign from "shared/assign"
export const UpdateState = 0
export function initialUpdateQueue(fiber) {
  //创建一个新的更新队列
  //pending其实是一个循环链接
  const queue = {
    shared: {
      pending: null,
    },
  }
  fiber.updateQueue = queue
}

export function createUpdate() {
  const update = { tag: UpdateState }
  return update
}
export function enqueueUpdate(fiber, update) {
  //获取更新队列
  const updateQueue = fiber.updateQueue
  const pending = updateQueue.shared.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  updateQueue.shared.pending = update
  //获取共享队列
  return markUpdateLaneFromFiberToRoot(fiber)
}

/**
 * 根据老状态和更新队列中的更新计算最新的状态
 * @param {*} workInProgress 要计算的fiber
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue
  const pendingQueue = queue.shared.pending
  //如果有更新或者更新队列里面有内容
  if (pendingQueue !== null) {
    //清除等待生效的更新
    queue.shared.pending = null
    //获取最后一个更新
    const lastPendingUpdate = pendingQueue
    //指向第一个更新
    const firstPendingUpdate = lastPendingUpdate.next
    //把更新链表剪断，变成单链表
    lastPendingUpdate.next = null
    //获取老状态
    let newState = workInProgress.memoizedState
    let update = firstPendingUpdate
    while (update) {
      newState = getStateFromUpdate(update, newState)
      update = update.next
    }
    workInProgress.memoizedState = newState
  }
}

/**
 * state=0 update=>1 update=2
 * 根据老状态和更新计算新状态
 * @param {*} update 更新的对象其实有很多种类型
 * @param {*} prevState
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update

      return assign({}, prevState, payload)
  }
}
