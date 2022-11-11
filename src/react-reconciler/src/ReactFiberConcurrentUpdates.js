import { HostRoot } from "./ReactWorkTags"
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber
  let parent = sourceFiber.return
  while (parent !== null) {
    node = parent
    parent = parent.return
  }
  if (node.tag === HostRoot) {
    const root = node.stateNode
    return root
  }
  return null
}
