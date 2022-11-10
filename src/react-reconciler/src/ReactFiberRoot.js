import { createHostRootFiber } from "./ReactFiber"

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo //div#root
}
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  //HostRoot指的就是根节点div#root
  const uninitializedFiber = createHostRootFiber()
  //根容器的current指向当前的根fiber
  root.current = uninitializedFiber
  //根fiber的stateNode,也就是真实DOM节点指向FiberRootNode
  uninitializedFiber.stateNode = root
  return root
}
