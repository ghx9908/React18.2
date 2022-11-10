import { createFiberRoot } from "./ReactFiberRoot"

export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo)
}
