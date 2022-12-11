import ReactSharedInternals from "shared/ReactSharedInternals"
const { ReactCurrentDispatcher } = ReactSharedInternals
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates"

let currentlyRenderingFiber = null //当前正在渲染中的fiber
let workInProgressHook = null
let currentHook = null
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
}
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
}

//useState其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action
}
function updateState() {
  return updateReducer(baseStateReducer)
}
function mountState(initialState) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialState
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer, //上一个reducer
    lastRenderedState: initialState, //上一个state
  }
  hook.queue = queue
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ))
  return [hook.memoizedState, dispatch]
}
function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false, //是否有急切的更新
    eagerState: null, //急切的更新状态
    next: null,
  }
  //当你派发动作后，我立刻用上一次的状态和上一次的reducer计算新状态
  const { lastRenderedReducer, lastRenderedState } = queue
  const eagerState = lastRenderedReducer(lastRenderedState, action)
  update.hasEagerState = true
  update.eagerState = eagerState
  if (Object.is(eagerState, lastRenderedState)) {
    return
  }
  //下面是真正的入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root)
}
/**
 * 构建新的hooks
 * @return 新构建的 workInProgressHook
 */
function updateWorkInProgressHook() {
  //获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate
    currentHook = current.memoizedState
  } else {
    currentHook = currentHook.next
  }
  //根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  }
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
  } else {
    workInProgressHook = workInProgressHook.next = newHook
  }
  return workInProgressHook
}

function updateReducer(reducer) {
  //获取新的hook
  const hook = updateWorkInProgressHook()
  //获取新的hook的更新队列
  const queue = hook.queue
  //获取老的hook
  const current = currentHook
  //获取将要生效的更新队列
  const pendingQueue = queue.pending
  //初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState
  if (pendingQueue !== null) {
    queue.pending = null
    const firstUpdate = pendingQueue.next
    let update = firstUpdate
    do {
      if (update.hasEagerState) {
        newState = update.eagerState
      } else {
        const action = update.action
        newState = reducer(newState, action)
      }
      update = update.next
    } while (update !== null && update !== firstUpdate)
  }
  hook.memoizedState = newState
  return [hook.memoizedState, queue.dispatch]
}

// function counter(state, action) {
//   if (action.type === 'add') return state + action.payload;
//   return state;
// }
// const [number2, setNumber2] = React.useReducer(counter, 0);
/**
 *
 * @param {*} reducer counter 函数
 * @param {*} initialArg 0
 * @returns [number2, setNumber2 ]
 */
function mountReducer(reducer, initialArg) {
  // 挂载构建中的hook
  //返回最新的 workInProgressHook  单向链表 指向最后一个
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialArg //0 要返回的第一个参数
  const queue = {
    pending: null,
    dispatch: null,
  }
  hook.queue = queue
  //要返回的第二个参数
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber, //当前渲染中的fiber
    queue
  ))

  return [hook.memoizedState, dispatch]
}

/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 * @param {*} fiber function对应的fiber
 * @param {*} queue hook对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  //在每个hook里会存放一个更新队列，更新队列是一个更新对象的循环链表update1.next=update2.next=update1
  const update = {
    action, //{ type: 'add', payload: 1 } 派发的动作
    next: null, //指向下一个更新对象
  }
  //把当前的最新的更添的添加更新队列中，并且返回当前的根fiber
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root)
}

/**
 * 挂载构建中的hook
 * @return workInProgressHook  单向链表
 * */
function mountWorkInProgressHook() {
  // 创建一个新的hook对象
  const hook = {
    memoizedState: null, //hook的状态 0
    queue: null, //存放本hook的更新队列 queue.pending=update的循环链表
    next: null, //指向下一个hook,一个函数里可以会有多个hook,它们会组成一个单向链表
  }
  if (workInProgressHook === null) {
    //当前函数对应的fiber的状态等于第一个hook对象  永远指向第一个hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    // workInProgressHook.next = hook
    // workInProgressHook = hook
    workInProgressHook = workInProgressHook.next = hook
  }
  return workInProgressHook
}
/**
 * 渲染函数组件
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress //Function组件对应的fiber
  //如果有老的fiber,并且有老的hook链表
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount
  }
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  return children
}
