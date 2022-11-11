import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols"
import { createFiberFromElement, createFiberFromText } from "./ReactFiber"
import { Placement, ChildDeletion } from "./ReactFiberFlags"
import isArray from "shared/isArray"
/**
 * @param {*} shouldTrackSideEffects 是否跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   *
   * @param {*} returnFiber 根fiber div#root对应的fiber
   * @param {*} currentFirstChild 老的FunctionComponent对应的fiber
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    //因为我们现实的初次挂载，老节点currentFirstChild肯定是没有的，所以可以直接根据虚拟DOM创建新的Fiber节点
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }
  /**
   * 设置副作用
   * @param {*} newFiber
   * @returns
   */
  function placeSingleChild(newFiber) {
    //说明要添加副作用
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      //要在最后的提交阶段插入此节点  React渲染分成渲染(创建Fiber树)和提交(更新真实DOM)二个阶段
      newFiber.flags |= Placement
    }
    return newFiber
  }

  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const created = createFiberFromText(`${newChild}`)
      created.return = returnFiber
      return created
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild)
          created.return = returnFiber
          return created
        }
        default:
          break
      }
    }
    return null
  }
  function placeChild(newFiber, newIdx) {
    //指定新的fiber在新的挂载索引
    newFiber.index = newIdx
    if (shouldTrackSideEffects) {
      //如果一个Fiber它的flags上有Placement，说明此节点需要创建真是的DOM并且插入到父容器中
      //如果父Fiber节点是初次挂载。shouldTrackSideEffects=false，不需要添加flags
      //这种情况会在完成阶段把所有的子节点添加到自己身上
      newFiber.flags |= Placement
    }
  }
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null //返回的第一个新儿子
    let previousNewFiber = null //上一个的一个新的儿fiber
    let newIdx = 0 //用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstChild //第一个老fiber
    // 开始第一轮循环 如果老fiber有值，新的虚拟DOM也有值
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx])
      if (newFiber === null) continue
      lastPlacedIndex = placeChild(newFiber, newIdx)
      //如果previousNewFiber为null，说明是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber //li(A).sibling=p(B).sibling=>li(C)
      } else {
        //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }
    //让newFiber成为最后一个或者说上一个子fiber
    return resultingFirstChild
  }
  /**
   * 比较子Fibers  DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老fiber第一个子fiber   current一般来说指的是老
   * @param {*} newChild 新的子虚拟DOM  h1虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    //现在需要处理更新的逻辑了，处理dom diff
    //现在暂时只考虑新的节点只有一个的情况
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          )
        default:
          break
      }
    }
    //newChild [hello文本节点,span虚拟DOM元素]
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
    }
    return null
  }

  return reconcileChildFibers
}

//有老父fiber更新的时候用这个
export const reconcileChildFibers = createChildReconciler(true)
//如果没有老父fiber,初次挂载的时候用这个
export const mountChildFibers = createChildReconciler(false)
