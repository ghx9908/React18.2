function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo //div#root
}
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  return root
}
