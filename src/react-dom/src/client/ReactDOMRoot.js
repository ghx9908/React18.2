import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/ReactFiberReconciler"
// Dom插件事件系统
import { listenToAllSupportedEvents } from "react-dom-bindings/src/events/DOMPluginEventSystem"
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
  //监听所有的支持的事件
  listenToAllSupportedEvents(container) //div#root
  return new ReactDOMRoot(root)
}
