import hasOwnProperty from "shared/hasOwnProperty"
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols"

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
}

function hasValidRef(config) {
  return config.ref !== undefined
}
function hasValidKey(config) {
  return config.key !== undefined
}

function ReactElement(type, key, ref, props) {
  return {
    //这就是React元素，也被称为虚拟DOM
    $$typeof: REACT_ELEMENT_TYPE,
    type, //h1 span
    key, //唯一标识
    ref, //后面再讲，是用来获取真实DOM元素
    props, //属性 children,style,id
  }
}
export function jsxDEV(type, config, maybeKey) {
  let propName //属性名
  const props = {} //属性对象
  let key = null //每个虚拟DOM可以有一个可选的key属性，用来区分一个父节点下的不同子节点
  let ref = null //引入，后面可以通过这实现获取真实DOM的需求
  if (hasValidKey(config)) {
    ref = config.ref
  }
  if (hasValidRef(config)) {
    ref = config.ref
  }
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName]
    }
  }
  return ReactElement(type, key, ref, props)
}
