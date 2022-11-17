/**
 *  判断当前虚拟DOM它的儿子是不是一个文本独生子
 * @param {*} type h1
 * @param {*} props {children:['hello',{$$typeof: Symbol(react.element),type:span }]}
 * @returns
 */
export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === "string" || typeof props.children === "number"
  )
}

/**
 * 创建文本dom节点
 * @param {*} content 文本内容
 * @returns 真实文本dom节点
 */
export function createTextInstance(content) {
  return document.createTextNode(content)
}
