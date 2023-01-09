import ReactSharedInternals from "shared/ReactSharedInternals"
const { ReactCurrentDispatcher } = ReactSharedInternals
import { requestUpdateLane, scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates"
import {
  Passive as PassiveEffect,
  Update as UpdateEffect,
} from "./ReactFiberFlags"
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags"
import { NoLane, NoLanes } from "./ReactFiberLane"

let currentlyRenderingFiber = null //当前正在渲染中的fiber
let workInProgressHook = null
let currentHook = null
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
}
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
}
/**
 *挂载LayoutEffect
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 * @returns
 */
function mountLayoutEffect(create, deps) {
  // 添加hooks链表 挂载副作用 给memoizedState赋值 （effect.next = effect）
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps)
}
/**
 *更新LayoutEffect
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 * @returns
 */
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps)
}
/**
 *挂载effect
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 * @returns
 */
function updateEffect(create, deps) {
  // 1024   useEffect 消极的HookPassive 8
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps)
}
/**
 *
 * @param {*} fiberFlags fiber 的flag PassiveEffect 1024
 * @param {*} hookFlags hook的flag HookPassive 8
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 */
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook() //取更新的hook
  const nextDeps = deps === undefined ? null : deps //新依赖数组
  let destroy
  //上一个老hook
  if (currentHook !== null) {
    //获取此useEffect这个Hook上老的effect对象 create deps destroy
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps //老的依赖
      // 用新数组和老数组进行对比，如果一样的话
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        //不管要不要重新执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue中
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps)
        return
      }
    }
  }
  //如果要执行的话需要修改fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags
  //如果要执行的话 添加HookHasEffect flag
  //有 Passive还需HookHasEffect,因为不是每个Passive都会执行的
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  )
}
/**
 * 比较新老依赖数组
 * @param {*} nextDeps  新依赖数组
 * @param {*} prevDeps 老依赖数组
 * @returns 依赖数组是否改变
 */
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return null
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue
    }
    return false
  }
  return true
}
/**
 *挂载effect
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 * @returns
 */
function mountEffect(create, deps) {
  // 1024   useEffect 消极的HookPassive 8
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps)
}
/**
 * 添加hooks链表 挂载副作用 给memoizedState赋值 （effect.next = effect）
 * @param {*} fiberFlags fiber 的flag PassiveEffect 1024
 * @param {*} hookFlags hook的flag HookPassive 8
 * @param {*} create effect 传入的第一个函数参数
 * @param {*} deps 传如的依赖
 */
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  //把当前的hook添加到hooks链表中
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  //给当前的函数组件fiber添加flags
  currentlyRenderingFiber.flags |= fiberFlags
  // 添加effect链表并返回effect 并且给  hook.memoizedState赋值
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  )
}

/**
 * 添加effect链表
 * @param {*} tag effect的标签
 * @param {*} create 创建方法
 * @param {*} destroy 销毁方法
 * @param {*} deps 依赖数组
 * @return  返回最后一个effect
 */
function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  }
  //拿当前fiber的更新队列
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue

  if (componentUpdateQueue === null) {
    // 当前effect是第一个 创建新的  {lastEffect: null}
    componentUpdateQueue = createFunctionComponentUpdateQueue()
    // 给 前fiber的更新队列赋值
    currentlyRenderingFiber.updateQueue = componentUpdateQueue
    // 循环链表  componentUpdateQueue.lastEffect指向最后一个effect
    componentUpdateQueue.lastEffect = effect.next = effect
  } else {
    const lastEffect = componentUpdateQueue.lastEffect
    if (lastEffect === null) {
      //是否能进来？
      componentUpdateQueue.lastEffect = effect.next = effect
    } else {
      // 追加effect
      const firstEffect = lastEffect.next
      lastEffect.next = effect
      effect.next = firstEffect
      componentUpdateQueue.lastEffect = effect
    }
  }
  return effect
}
/**
 * 初始创建函数组件UpdateQueue
 * @returns {} {lastEffect: null} 尾指针
 */
function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  }
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
  // 获取当前的更新赛道 1
  const lane = requestUpdateLane()
  const update = {
    lane, //本次更新优先级就是1
    action,
    hasEagerState: false, //是否有急切的更新
    eagerState: null, //急切的更新状态
    next: null,
  }
  const alternate = fiber.alternate
  //当你派发动作后，我立刻用上一次的状态和上一次的reducer计算新状态
  if (
    fiber.lanes === NoLanes &&
    (alternate === null || alternate.lanes == NoLanes)
  ) {
    //先获取队列上的老的状态和老的reducer
    const { lastRenderedReducer, lastRenderedState } = queue
    //使用上次的状态和上次的reducer结合本次action进行计算新状态
    const eagerState = lastRenderedReducer(lastRenderedState, action)
    update.hasEagerState = true
    update.eagerState = eagerState
    if (Object.is(eagerState, lastRenderedState)) {
      return
    }
  }
  //下面是真正的入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane)
  scheduleUpdateOnFiber(root, fiber, lane)
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
    lastRenderedReducer: reducer,
    lastRenderedState: initialArg,
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
  workInProgress.updateQueue = null //每次构建跟新队列先清空
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
