import { allowConcurrentByDefault } from "shared/ReactFeatureFlags"

export const TotalLanes = 31
export const NoLanes = 0b0000000000000000000000000000000
export const NoLane = 0b0000000000000000000000000000000
export const SyncLane = 0b0000000000000000000000000000001
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010
export const InputContinuousLane = 0b0000000000000000000000000000100
export const DefaultHydrationLane = 0b0000000000000000000000000001000
export const DefaultLane = 0b0000000000000000000000000010000
export const SelectiveHydrationLane = 0b0001000000000000000000000000000
export const IdleHydrationLane = 0b0010000000000000000000000000000
export const IdleLane = 0b0100000000000000000000000000000
export const OffscreenLane = 0b1000000000000000000000000000000
const NonIdleLanes = 0b0001111111111111111111111111111

export function markRootUpdated(root, updateLane) {
  //pendingLanes指的此根上等待生效的lane
  root.pendingLanes |= updateLane
}

export function getNextLanes(root, wipLanes) {
  //先获取所有的有更新的车道
  const pendingLanes = root.pendingLanes
  if (pendingLanes == NoLanes) {
    return NoLanes
  }
  //获取所有的车道中最高优先级的车道
  const nextLanes = getHighestPriorityLanes(pendingLanes)
  if (wipLanes !== NoLane && wipLanes !== nextLanes) {
    //新的车道值比渲染中的车道大，说明新的车道优先级更低
    if (nextLanes > wipLanes) {
      return wipLanes
    }
  }
  return nextLanes
}
export function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes)
}
//找到最右边的1 只能返回一个车道
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes
}
export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes
}
/**
 * 源码此处的逻辑有大的改变动
 * 以前
 * pendingLanes= 001100
 * 找到最右边的1  000100
 * nextLanes     000111
 *
 * 现在的源码已经改了
 * pendingLanes= 001100
 * 找到最右边的1  000100
 *  update 000010
 * 那是不是意味着以前是不检测车道上有没有任务的，就是先拿优先级再检测？
 */

export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset
}
export function mergeLanes(a, b) {
  return a | b
}

export function includesBlockingLane(root, lanes) {
  //如果允许默认并行渲染
  if (allowConcurrentByDefault) {
    return false
  }
  const SyncDefaultLanes = InputContinuousLane | DefaultLane
  return (lanes & SyncDefaultLanes) !== NoLane
}
