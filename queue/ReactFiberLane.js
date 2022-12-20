//二个车道 1 2
const NoLanes = 0b00;
const NoLane = 0b00;
const SyncLane = 0b01;//1
const InputContinuousHydrationLane = 0b10;//2

function initializeUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState,//本次更新前当前的fiber的状态,更新会其于它进行计算状态
    firstBaseUpdate: null,//本次更新前该fiber上保存的上次跳过的更新链表头
    lastBaseUpdate: null,//本次更新前该fiber上保存的上次跳过的更新链尾部
    shared: {
      pending: null
    }
  }
  fiber.updateQueue = queue;
}

function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}
function processUpdateQueue(fiber, renderLanes) {
  const queue = fiber.updateQueue;
  //老链表头
  let firstBaseUpdate = queue.firstBaseUpdate;
  //老链表尾巴
  let lastBaseUpdate = queue.lastBaseUpdate;
  //新链表尾部
  const pendingQueue = queue.shared.pending;
  //合并新老链表为单链表
  if (pendingQueue !== null) {
    queue.shared.pending = null;
    //新链表尾部
    const lastPendingUpdate = pendingQueue;
    //新链表尾部
    const firstPendingUpdate = lastPendingUpdate.next;
    //把老链表剪断，变成单链表
    lastPendingUpdate.next = null;
    //如果没有老链表
    if (lastBaseUpdate === null) {
      //指向新的链表头
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate
  }
  //如果链表不为空firstBaseUpdate=>lastBaseUpdate
  if (firstBaseUpdate !== null) {
    let currentState = fiber.memoizedState;
    let update = firstBaseUpdate;
    do {
      //如果当前的渲染优先级比当前的更新优先级要小或相等，此更新就需要生效
      if (renderLanes >= update.lane) {
        currentState = update.payload(currentState);
      } else {
        // 如果优先级不够，需要保存跳过的更新到baseQueue
      }
      update = update.next;
    } while (update);
    fiber.memoizedState = currentState;
  }
}
//新建一fiber
//演示如何给fiber添加不同优先级的更新
//在执行渲染的时候总是优先最高的更执行,跳过优先低的更新
let fiber = { memoizedState: '' };
initializeUpdateQueue(fiber);
let updateA = { id: 'A', payload: (state) => state + 'A', lane: InputContinuousHydrationLane };
enqueueUpdate(fiber, updateA);
let updateB = { id: 'B', payload: (state) => state + 'B', lane: SyncLane };
enqueueUpdate(fiber, updateB);
let updateC = { id: 'C', payload: (state) => state + 'C', lane: InputContinuousHydrationLane };
enqueueUpdate(fiber, updateC);
let updateD = { id: 'D', payload: (state) => state + 'D', lane: SyncLane };
enqueueUpdate(fiber, updateD);
//处理新队列 在处理的时候需要指定一个渲染优先级
processUpdateQueue(fiber, SyncLane);
console.log(fiber.memoizedState);//BD
//此时会把ABCD这个链接放在baseQueue
let updateE = { id: 'E', payload: (state) => state + 'E', lane: InputContinuousHydrationLane };
enqueueUpdate(fiber, updateE);
let updateF = { id: 'F', payload: (state) => state + 'F', lane: SyncLane };
enqueueUpdate(fiber, updateF);
//pendingQueue = EF
processUpdateQueue(fiber, InputContinuousHydrationLane);
console.log(fiber.memoizedState);//ABCDEF
