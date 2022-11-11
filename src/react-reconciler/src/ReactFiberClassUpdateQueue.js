import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates"

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
