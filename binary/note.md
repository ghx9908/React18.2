# 有三套
## 车道优先级
src\react\packages\react-reconciler\src\ReactFiberLane.old.js

```js
//无 0
export const NoLanes = 0b0000000000000000000000000000000;
export const NoLane = 0b0000000000000000000000000000000;
//同步车道
export const SyncLane = 0b0000000000000000000000000000001;
//输入连续水合赛道
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010;
```

## 事件优先级

src\react\packages\react-reconciler\src\ReactEventPriorities.old.js

```js
export const DiscreteEventPriority = SyncLane;
export const ContinuousEventPriority = InputContinuousLane;
export const DefaultEventPriority = DefaultLane;
export const IdleEventPriority = IdleLane;
```

## scheduler优先级
src\react\packages\scheduler\src\SchedulerPriorities.js

```js
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
```

src\react\packages\react-reconciler\src\ReactFiberWorkLoop.old.js
```js
 let schedulerPriorityLevel;

    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;

      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;

      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;

      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;

      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }

    newCallbackNode = scheduleCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
```