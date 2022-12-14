import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols"
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber"
import { Placement, ChildDeletion } from "./ReactFiberFlags"
import isArray from "shared/isArray"
/**
 * @param {*} shouldTrackSideEffects 是否跟踪副作用 //是否有老fiber false == 不跟踪副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
  }
  /**
   *给父fiber的deletions和flags赋值
   * @param {*} returnFiber 父fiber
   * @param {*} childToDelete 将要删除的老节点
   * @returns
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return
    const deletions = returnFiber.deletions
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      returnFiber.deletions.push(childToDelete)
    }
  }

  //删除从currentFirstChild之后所有的fiber节点
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return
    let childToDelete = currentFirstChild
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
    return null
  }
  /**
   *
   * @param {*} returnFiber 根fiber div#root对应的fiber
   * @param {*} currentFirstChild 老的FunctionComponent对应的fiber
   * @param {*} element 新的虚拟DOM对象
   * @returns 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    //新的虚拟DOM的key,也就是唯一标准

    const key = element.key // null
    let child = currentFirstChild //老的FunctionComponent对应的fiber

    while (child !== null) {
      //有老fiber
      //判断此老fiber对应的key和新的虚拟DOM对象的key是否一样 null===null
      if (child.key === key) {
        //判断老fiber对应的类型和新虚拟DOM元素对应的类型是否相同
        if (child.type === element.type) {
          // p div
          deleteRemainingChildren(returnFiber, child.sibling)
          //如果key一样，类型也一样，则认为此节点可以复用
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        } else {
          //如果找到一key一样老fiber,但是类型不一样，不能此老fiber,把剩下的全部删除
          deleteRemainingChildren(returnFiber, child)
        }
      } else {
        deleteChild(returnFiber, child)
      }
      child = child.sibling
    }

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
  /**
   * 创建fiber 并且给pendingProps赋值
   * @param {*} returnFiber 新创建fiber的父Fiber
   * @param {*} newChild  要创建的一个子虚拟dom
   * @returns 新创建子fiber
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      //创建文本的子虚拟dom 创建的文本fiber 给 tag， pendingProps ，key赋值  pendingProps = hello
      const created = createFiberFromText(`${newChild}`) //新创建的fiber
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
  /**
   *  指定新的fiber在新的挂载索引 别切根据是否有副作用设置fiber的flags  newFiber.index = newIdx newFiber.flags |= Placement
   * @param {*} newFiber
   * @param {*} newIdx
   */
  function placeChild(newFiber, newIdx) {
    //指定新的fiber在新的挂载索引
    newFiber.index = newIdx
    //如果不需要跟踪副作用
    if (!shouldTrackSideEffects) {
      return
    }
    //获取它的老fiber
    const current = newFiber.alternate
    //如果有，说明这是一个更新的节点，有老的真实DOM。
    if (current !== null) {
      return
    } else {
      //如果没有，说明这是一个新的节点，需要插入
      newFiber.flags |= Placement
    }
  }
  function updateElement(returnFiber, current, element) {
    const elementType = element.type
    if (current !== null) {
      //判断是否类型一样，则表示key和type都一样，可以复用老的fiber和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props)
        existing.return = returnFiber
        return existing
      }
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null
    if (newChild !== null && typeof newChild === "object") {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          //如果key一样，进入更新元素的逻辑
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild)
          }
        }
        default:
          return null
      }
    }
    return null
  }
  /**
   * 创建子fiber链表并返回第一个子fiber
   * @param {*} returnFiber 需要新biber对应父biber
   * @param {*} currentFirstChild 老fiber对应的子fiber
   * @param {*} newChildren 虚拟dom [hello文本节点,span虚拟DOM元素]
   * @returns 返回第一个子fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null //返回的第一个新儿子
    let previousNewFiber = null //上一个的一个新的儿fiber
    let newIdx = 0 //用来遍历新的虚拟DOM的索引
    let oldFiber = currentFirstChild //第一个老fiber
    let nextOldFiber = null //下一个第fiber
    // 开始第一轮循环 如果老fiber有值，新的虚拟DOM也有值
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      //先暂下一个老fiber
      nextOldFiber = oldFiber.sibling
      //试图更新或者试图复用老的fiber
      debugger
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx])
      if (newFiber === null) {
        break
      }
      if (shouldTrackSideEffects) {
        //如果有老fiber,但是新的fiber并没有成功复用老fiber和老的真实DOM，那就删除老fiber,在提交阶段会删除真实DOM
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber)
        }
      }
      //指定新fiber的位置
      placeChild(newFiber, newIdx)
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber //li(A).sibling=p(B).sibling=>li(C)
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }
    //新的虚拟DOM已经循环完毕，3=>2
    if (newIdx === newChildren.length) {
      //删除剩下的老fiber
      deleteRemainingChildren(returnFiber, oldFiber)
      return resultingFirstChild
    }
    if (oldFiber === null) {
      //如果老的 fiber已经没有了， 新的虚拟DOM还有，进入插入新节点的逻辑
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx])
        if (newFiber === null) continue
        placeChild(newFiber, newIdx)
        //如果previousNewFiber为null，说明这是第一个fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber //这个newFiber就是大儿子
        } else {
          //否则说明不是大儿子，就把这个newFiber添加上一个子节点后面
          previousNewFiber.sibling = newFiber
        }
        //让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber
      }
    }

    return resultingFirstChild
  }
  /**
   * 比较子Fibers  DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   * 创建子fiber链表并返回第一个子fiber
   * @param {*} returnFiber 新的父Fiber
   * @param {*} currentFirstChild 老fiber第一个子fiber   current一般来说指的是老
   * @param {*} newChild 新的子虚拟DOM  h1虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    //现在需要处理更新的逻辑了，处理dom diff
    //现在暂时只考虑 有一个的情况
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
      //创建子fiber链表并返回第一个子fiber
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
