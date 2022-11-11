import { scheduleCallback } from "scheduler"
/**
 * 计划更新root
 * 源码中此处有一个任务的功能
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  //确保调度执行root上的更新
  ensureRootIsScheduled(root)
}
function ensureRootIsScheduled(root) {
  //告诉 浏览器要执行performConcurrentWorkOnRoot 在此触发更新
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root))
}
/**
 * 根据fiber构建fiber树,要创建真实的DOM节点，还需要把真实的DOM节点插入容器
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  console.log("performConcurrentWorkOnRoot", root)
}
