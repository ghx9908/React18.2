//在渲染阶段这些effect已经准备好了
let effects = [
  {
    type: "useEffect",
    create: "useEffect1Create",
    destroy: "useEffect1Destroy",
  },
  {
    type: "useLayoutEffect",
    create: "useLayoutEffect2Create",
    destroy: "useLayoutEffect2Destroy",
  },
  {
    type: "useEffect",
    create: "useEffect3Create",
    destroy: "useEffect3Destroy",
  },
  {
    type: "useLayoutEffect",
    create: "useLayoutEffect4Create",
    destroy: "useLayoutEffect4Destroy",
  },
]
// 在渲染之后会进入 提交Commit阶段
// Commit提供阶段分成二个步骤
// commitBeforeMutationEffects  DOM变更前
// commitMutationEffects  DOM变更
// commitHookLayoutEffects DOM变更后
//Commit完成后

// 初次挂载的时候
// commitHookLayoutEffects同步执行的 useLayoutEffect2Create 和 useLayoutEffect4Create
// 会在下一个宏任务中，异步执行的 useEffect1Create和useEffect3Create

//更新的时候
//先在commitMutationEffects中同步执行 useLayoutEffect2Destroy和useLayoutEffect4Destroy
//紧接着会在commitHookLayoutEffects同步执行useLayoutEffect2Create和useLayoutEffect4Create

// 会在下一个宏任务中，异步执行
//  useEffect1Destroy和useEffect3Destroy
//  useEffect1Create和useEffect3Create
