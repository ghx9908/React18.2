import ReactSharedInternals from "shared/ReactSharedInternals"
const { ReactCurrentDispatcher } = ReactSharedInternals
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop"
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates"

let currentlyRenderingFiber = null //当前正在渲染中的fiber
let workInProgressHook = null
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
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
  ReactCurrentDispatcher.current = HooksDispatcherOnMount
  const children = Component(props)
  return children
}
