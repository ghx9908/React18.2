//二个车道 1 2
const NoLanes = 0b00
const NoLane = 0b00
const SyncLane = 0b01 //1
const InputContinuousHydrationLane = 0b10 //2

function isSubsetOfLanes(set, subset) {
  //set    00110
  //subset 00010
  return (set & subset) === subset
}
//a    0010
//b    0001
//     0011
function mergeLanes(a, b) {
  return a | b
}

function initializeUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState, //本次更新前当前的fiber的状态,更新会其于它进行计算状态
    firstBaseUpdate: null, //本次更新前该fiber上保存的上次跳过的更新链表头
    lastBaseUpdate: null, //本次更新前该fiber上保存的上次跳过的更新链尾部
    shared: {
      pending: null,
    },
  }
  fiber.updateQueue = queue
}

function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  const sharedQueue = updateQueue.shared
  const pending = sharedQueue.pending
  if (pending === null) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }
  sharedQueue.pending = update
}
function processUpdateQueue(fiber, renderLanes) {
  const queue = fiber.updateQueue
  //老链表头
  let firstBaseUpdate = queue.firstBaseUpdate
  //老链表尾巴
  let lastBaseUpdate = queue.lastBaseUpdate
  //新链表尾部
  const pendingQueue = queue.shared.pending
  //合并新老链表为单链表
  if (pendingQueue !== null) {
    queue.shared.pending = null
    //新链表尾部
    const lastPendingUpdate = pendingQueue
    //新链表尾部
    const firstPendingUpdate = lastPendingUpdate.next
    //把老链表剪断，变成单链表
    lastPendingUpdate.next = null
    //如果没有老链表
    if (lastBaseUpdate === null) {
      //指向新的链表头
      firstBaseUpdate = firstPendingUpdate
    } else {
      lastBaseUpdate.next = firstPendingUpdate
    }
    lastBaseUpdate = lastPendingUpdate
  }
  //如果链表不为空firstBaseUpdate=>lastBaseUpdate
  if (firstBaseUpdate !== null) {
    //上次跳过的更新前的状态
    let newState = queue.baseState
    //尚未执行的更新的lane
    let newLanes = NoLanes
    let newBaseState = null
    let newFirstBaseUpdate = null
    let newLastBaseUpdate = null
    let update = firstBaseUpdate //updateA
    do {
      //获取此更新车道
      const updateLane = update.lane
      //如果说updateLane不是renderLanes的子集的话，说明本次渲染不需要处理过个更新，就是需要跳过此更新
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        //把此更新克隆一份
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload,
        }
        //说明新的跳过的base链表为空,说明当前这个更新是第一个跳过的更新
        if (newLastBaseUpdate === null) {
          //让新的跳过的链表头和链表尾都指向这个第一次跳过的更新
          newFirstBaseUpdate = newLastBaseUpdate = clone
          //计算保存新的baseState为此跳过更新时的state
          newBaseState = newState // ""
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }
        //如果有跳过的更新，就把跳过的更新所在的赛道合并到newLanes,
        //最后会把newLanes赋给fiber.lanes
        newLanes = mergeLanes(newLanes, updateLane)
      } else {
        //说明已经有跳过的更新了
        if (newLastBaseUpdate !== null) {
          const clone = {
            id: update.id,
            lane: NoLane,
            payload: update.payload,
          }
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }
        newState = getStateFromUpdate(update, newState)
      }
      update = update.next
    } while (update)
    //如果没能跳过的更新的话
    if (!newLastBaseUpdate) {
      newBaseState = newState
    }
    queue.baseState = newBaseState
    queue.firstBaseUpdate = newFirstBaseUpdate
    queue.lastBaseUpdate = newLastBaseUpdate
    fiber.lanes = newLanes
    //本次渲染完会判断，此fiber上还有没有不为0的lane,如果有，会再次渲染
    fiber.memoizedState = newState
  }
}
function getStateFromUpdate(update, prevState) {
  return update.payload(prevState)
}
//新建一fiber
//演示如何给fiber添加不同优先级的更新
//在执行渲染的时候总是优先最高的更执行,跳过优先低的更新
let fiber = { memoizedState: "" }
initializeUpdateQueue(fiber)
let updateA = { id: "A", payload: (state) => state + "A", lane: SyncLane }
enqueueUpdate(fiber, updateA)
let updateB = { id: "B", payload: (state) => state + "B", lane: SyncLane }
enqueueUpdate(fiber, updateB)
let updateC = { id: "C", payload: (state) => state + "C", lane: SyncLane }
enqueueUpdate(fiber, updateC)
let updateD = { id: "D", payload: (state) => state + "D", lane: SyncLane }
enqueueUpdate(fiber, updateD)
//处理新队列 在处理的时候需要指定一个渲染优先级
processUpdateQueue(fiber, SyncLane)
console.log(fiber.memoizedState) //ABD
console.log("updateQueue", printUpdateQueue(fiber.updateQueue)) // ABCD#null
//此时会把ABCD这个链接放在baseQueue
let updateE = {
  id: "E",
  payload: (state) => state + "E",
  lane: InputContinuousHydrationLane,
}
enqueueUpdate(fiber, updateE)
let updateF = { id: "F", payload: (state) => state + "F", lane: SyncLane }
enqueueUpdate(fiber, updateF)
//pendingQueue = EF
processUpdateQueue(fiber, InputContinuousHydrationLane)
console.log(fiber.memoizedState) //ABCDEF

function printUpdateQueue(updateQueue) {
  const { baseState, firstBaseUpdate } = updateQueue
  let desc = baseState + "#"
  let update = firstBaseUpdate
  while (update) {
    desc += update.id + "=>"
    update = update.next
  }
  desc += "null"
  return desc
}
