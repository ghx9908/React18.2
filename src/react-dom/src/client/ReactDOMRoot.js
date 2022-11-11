import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler"

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot
}
ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot
  root.containerInfo.innerHTML = ""
  updateContainer(children, root)
}
export function createRoot(container) {
  // div#root
  const root = createContainer(container)
  return new ReactDOMRoot(root)
}
