import {
  NoLane,
  SyncLane,
  InputContinuousLane,
  DefaultLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from "./ReactFiberLane"
//数字越小 优先级越高
//离散事件优先级 click onchange 点击事件  //同步事件优先级
export const DiscreteEventPriority = SyncLane //1
//连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane //4
//默认事件车道 默认事件优先级
export const DefaultEventPriority = DefaultLane //16
//空闲事件优先级
export const IdleEventPriority = IdleLane //最大

let currentUpdatePriority = NoLane
/**
 *
 * @returns 获取当前的更新优先级
 */
export function getCurrentUpdatePriority() {
  return currentUpdatePriority
}
/**
 * 设置当前的更新优先级
 * @param {*} newPriority
 */
export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority
}

/**
 * 判断eventPriority是不是比lane要小，更小意味着优先级更高
 * @param {*} a// 事件优先级
 * @param {*} b//lean
 * @returns
 */
export function isHigherEventPriority(eventPriority, lane) {
  return eventPriority !== 0 && eventPriority < lane
}
/**
 * 把lane转成事件优先级
 * lane 31个
 * 事件优先级是4个
 * 调度优先级5个
 * @param {*} lanes
 * @returns
 */
export function lanesToEventPriority(lanes) {
  //获取最高优先级的lane
  let lane = getHighestPriorityLane(lanes)
  // 离散事件优先级
  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority //1
  }
  // 连续事件优先级
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority //4
  }
  // 默认事件优先级
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority //16
  }
  // 空闲事件优先级
  return IdleEventPriority //
}
