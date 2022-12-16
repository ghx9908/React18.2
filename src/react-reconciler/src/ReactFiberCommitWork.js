import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags"
import {
  Placement,
  MutationMask,
  Update,
  Passive,
  LayoutMask,
} from "./ReactFiberFlags"

import {
  appendChild,
  insertBefore,
  commitUpdate,
  removeChild,
} from "react-dom-bindings/src/client/ReactDOMHostConfig"
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags"

let hostParent = null
/**
 * 提交删除副作用
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deletedFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber
  //一直向上找，找到真实的DOM节点为此
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent: {
        hostParent = parent.stateNode
        break findParent
      }
      case HostRoot: {
        hostParent = parent.stateNode.containerInfo
        break findParent
      }
    }
    parent = parent.return
  }
  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber)
  hostParent = null
}

/**
 * 删除fiber
 * @param {*} finishedRoot 跟biber
 * @param {*} nearestMountedAncestor 最近的父fiber
 * @param {*} deletedFiber 要删除的fiber
 */
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText: {
      //当要删除一个节点的时候，要先删除它的子节点
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      )
      //再把自己删除
      if (hostParent !== null) {
        removeChild(hostParent, deletedFiber.stateNode)
      }
      break
    }
    default:
      break
  }
}
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  let child = parent.child
  while (child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child)
    child = child.sibling
  }
}
/**
 * 递归遍历处理变更的作用
 * @param {*} root 根节点
 * @param {*} parentFiber  父fiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  //先把父fiber上该删除的节点都删除
  const deletions = parentFiber.deletions
  if (deletions !== null) {
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i]
      //提交删除副作用
      commitDeletionEffects(root, parentFiber, childToDelete)
    }
  }
  //再去处理剩下的子节点
  //判断是否有副作用
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root)
      child = child.sibling
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork
  //如果此fiber要执行插入操作的话
  if (flags & Placement) {
    //进行插入操作，也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
    commitPlacement(finishedWork)
    //把flags里的Placement删除
    finishedWork.flags & ~Placement
  }
}
/**
 * 判断是否是真实dom节点
 * @param {*} fiber
 * @returns 是否是真实dom节点
 */
function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag == HostRoot //div#root
}

/**
 * 获取父真实dom节点fiber
 * @param {*} fiber
 * @returns 父真实dom节点fiber
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return
  while (parent !== null) {
    //判断是否是真实dom节点
    if (isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }
}

/**
 * 把子节点对应的真实DOM插入到父节点DOM中
 * @param {*} node 将要插入的fiber节点
 * @param {*} before 最近的弟弟真实DOM节点
 * @param {*} parent 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node
  //判断此fiber对应的节点是不是真实DOM节点  5|6
  const isHost = tag === HostComponent || tag === HostText
  //如果是的话直接插入
  if (isHost) {
    const { stateNode } = node
    if (before) {
      //往最近的弟弟真实DOM 前面插入新的节点
      insertBefore(parent, stateNode, before)
    } else {
      appendChild(parent, stateNode)
    }
  } else {
    //如果node不是真实的DOM节点，获取它的大儿子
    const { child } = node
    if (child !== null) {
      //把大儿子添加到父亲DOM节点里面去
      insertOrAppendPlacementNode(child, before, parent)
      let { sibling } = child
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent)
        sibling = sibling.sibling
      }
    }
  }
}
/**
 * 找到要插入的锚点
 * 找到可以插在它的前面的那个fiber对应的真实DOM
 * @param {*} fiber
 * @return 要插入的锚点
 */
function getHostSibling(fiber) {
  let node = fiber
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }
    node = node.sibling
    //如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      //如果此节点是一个将要插入的新的节点，找它的弟弟
      if (node.flags & Placement) {
        continue siblings
      } else {
        node = node.child
      }
    }
    if (!(node.flags & Placement)) {
      return node.stateNode
    }
  }
}

/**
 * 把此fiber的真实DOM插入到父DOM里
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  // 获取父真实dom节点fiber
  const parentFiber = getHostParentFiber(finishedWork)
  //查找真实dom节点
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo //父真实dom节点
      const before = getHostSibling(finishedWork) //获取最近的弟弟真实DOM节点 要插入的锚点

      //插入或者追加插入的节点
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    case HostComponent: {
      const parent = parentFiber.stateNode //父真实dom节点
      const before = getHostSibling(finishedWork) //获取最近的弟弟真实DOM节点
      //插入或者追加插入的节点
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    default:
      break
  }
}
/**
 * 遍历fiber树，执行fiber上的副作用
 * @param {*} finishedWork fiber节点
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case FunctionComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork)
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork)
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork)
      }
      break
    }
    case HostRoot:

    case HostText: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork)
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork)
      break
    }
    case HostComponent: {
      //先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork)
      //再处理自己身上的副作用
      commitReconciliationEffects(finishedWork)
      //处理DOM更新
      if (flags & Update) {
        //获取真实DOM
        const instance = finishedWork.stateNode
        //更新真实DOM
        if (instance !== null) {
          const newProps = finishedWork.memoizedProps
          const oldProps = current !== null ? current.memoizedProps : newProps
          const type = finishedWork.type
          const updatePayload = finishedWork.updateQueue
          finishedWork.updateQueue = null
          if (updatePayload) {
            commitUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            )
          }
        }
      }
      break
    }
    default:
      break
  }
}
/**
 *  执行卸载副作用，destroy
 * @param {*} finishedWork 根fiber
 */
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork)
}
/**
 *  执行卸载副作用，destroy
 * @param {*} finishedWork 根fiber
 */
function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      if (flags & Passive) {
        //1024
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive
        )
      }
      break
    }
  }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child !== null) {
      commitPassiveUnmountOnFiber(child)
      child = child.sibling
    }
  }
}
/**
 *
 * @param {*} finishedWork 完成的fiber
 * @param {*} hookFlags flags
 */
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork)
}

/**
 *  提交hook链表卸载 执行循环链表
 * @param {*} flags flags
 * @param {*} finishedWork 完成的fiber
 */
function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      //如果此 effect类型和传入的相同，都是 9 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy
        if (destroy !== undefined) {
          destroy()
        }
      }
      effect = effect.next
    } while (effect !== firstEffect)
  }
}
/**
 * 执行挂载副作用 create
 * @param {*} root 根节点
 * @param {*} finishedWork 根fiber
 */
export function commitPassiveMountEffects(root, finishedWork) {
  //提交副作用fiber上
  commitPassiveMountOnFiber(root, finishedWork)
}
/**
 *提交副作用fiber上
 * @param {*} finishedRoot  完成的根节点
 * @param {*} finishedWork  完成的fiber
 */
function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags //取flags
  switch (
    finishedWork.tag //取标签类型
  ) {
    case HostRoot: {
      //递归遍历PassiveMountEffects
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      if (flags & Passive) {
        //1024 提交钩子上的MountEffects
        commitHookPassiveMountEffects(finishedWork, HookHasEffect | HookPassive)
      }
      break
    }
  }
}
/**
 * 递归遍历PassiveMountEffects
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber
 */
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child !== null) {
      commitPassiveMountOnFiber(root, child)
      child = child.sibling
    }
  }
}
/**
 *提交钩子上的MountEffects
 * @param {*} finishedWork fiber
 * @param {*} hookFlags flags 8
 */
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}
/**
 * 提交hook链表挂载 执行循环链表
 * @param {*} flags flags 9
 * @param {*} finishedWork fiber
 */
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null
  if (lastEffect !== null) {
    //获取 第一个effect
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      //如果此 effect类型和传入的相同，都是 9 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const create = effect.create
        //执行create 并且将返回值给 effect.destroy
        effect.destroy = create()
      }
      effect = effect.next
    } while (effect !== firstEffect)
  }
}
/**
 *
 * @param {*} finishedWork fiber
 * @param {*} root 根节点
 */
export function commitLayoutEffects(finishedWork, root) {
  //老的根fiber
  const current = finishedWork.alternate
  commitLayoutEffectOnFiber(root, current, finishedWork)
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork)
      if (flags & LayoutMask) {
        // LayoutMask=Update=4
        commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout) //5
      }
      break
    }
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child
    while (child !== null) {
      const current = child.alternate
      commitLayoutEffectOnFiber(root, current, child)
      child = child.sibling
    }
  }
}
