import { createFiberRoot } from "./ReactFiberRoot"
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue"
import { scheduleUpdateOnFiber, requestUpdateLane, requestEventTime } from "./ReactFiberWorkLoop"
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo)
}
/**
 * 更新容器，把虚拟dom element变成真实DOM插入到container容器中
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器 FiberRootNode containerInfo div#root
 */
export function updateContainer(element, container) {
  //获取当前的根fiber
  const current = container.current
  const eventTime = requestEventTime()
  // 获取当前优先级 先取更新优先级，如果没有再取事件优先级 默认 16
  const lane = requestUpdateLane(current)
  //创建更新
  const update = createUpdate(lane)
  //要更新的虚拟DOM
  update.payload = { element } //h1
  //把此更新对象添加到current这个根Fiber的更新队列上,返回根节点
  //把更新先缓存到concurrentQueue数组中
  const root = enqueueUpdate(current, update, lane)
  // 开始调度更新
  scheduleUpdateOnFiber(root, current, lane, eventTime)
}
