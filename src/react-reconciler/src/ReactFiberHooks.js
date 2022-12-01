import ReactSharedInternals from "shared/ReactSharedInternals"
const { ReactCurrentDispatcher } = ReactSharedInternals
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
}

function mountReducer(reducer, initialArg) {
  return [1]
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
  ReactCurrentDispatcher.current = HooksDispatcherOnMount
  const children = Component(props)
  return children
}
