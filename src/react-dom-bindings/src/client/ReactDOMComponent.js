import { setValueForStyles } from "./CSSPropertyOperations"
import setTextContent from "./setTextContent"
import { setValueForProperty } from "./DOMPropertyOperations"

/**
 * 把 workInProgress.pendingProps 内容挂载到dom上
 * node.style.color = red node.textContent = text node.setAttribute(name, value)
 * @param {*} tag span
 * @param {*} domElement 新创建的真实dom节点
 * @param {*} nextProps workInProgress.pendingProps 待生效的属性 {children:'world',style:{color:'red'}}
 */
const STYLE = "style"
const CHILDREN = "children"
function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey]
      if (propKey === STYLE) {
        //遍历将styles 样式挂在真实dom节点上 node.style.color = red
        setValueForStyles(domElement, nextProp) //(span  {color:red})
      } else if (propKey == CHILDREN) {
        //设置文本内容到dom上 node.textContent = text
        if (typeof nextProp === "string") {
          setTextContent(domElement, nextProp)
        } else if (typeof nextProp === "number") {
          setTextContent(domElement, `${nextProp}`)
        }
      } else if (nextProp !== null) {
        //设置除children styles的其他属性 node.setAttribute(name, value)
        setValueForProperty(domElement, propKey, nextProp)
      }
    }
  }
}

/**
 * 把 workInProgress.pendingProps 内容挂载到dom上
 * node.style.color = red node.textContent = text node.setAttribute(name, value)
 * @param {*} domElement 新创建的真实dom节点
 * @param {*} tag  span
 * @param {*} props workInProgress.pendingProps 待生效的属性
 */
export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props)
}
