//1.把虚拟DOM构建成fiber树
let A1 = { type: 'div', props: { id: 'A1' } };
let B1 = { type: 'div', props: { id: 'B1' }, return: A1 };
let B2 = { type: 'div', props: { id: 'B2' }, return: A1 };
let C1 = { type: 'div', props: { id: 'C1' }, return: B1 };
let C2 = { type: 'div', props: { id: 'C2' }, return: B1 };
//A1的第一个子节点B1
A1.child = B1;
//B1的弟弟是B2
B1.sibling = B2;
//B1的第一个子节点C1
B1.child = C1;
//C1的弟弟是C2
C1.sibling = C2;

//下一个工作单元
let nextUnitOfWork = null;
const hasTimeRemaining = () => Math.floor(Math.random() * 10) % 2 == 0;
//render工作循环
function workLoop() {
  //工作循环每一次处理一个fiber,处理完以后可以暂停
  //如果有下一个任务并且有剩余的时间的话，执行下一个工作单元，也就是一个fiber
  while (nextUnitOfWork && hasTimeRemaining()) {
    //执行一个任务并返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  console.log('render阶段结束');
  //render阶段结束
}
function performUnitOfWork(fiber) {// A1
  let child = beginWork(fiber);
  //如果执行完A1之后，会返回A1的第一个子节点
  if (child) {
    return child;
  }
  //如果没有子节点
  while (fiber) {//如果没有子节点说明当前节点已经完成了渲染工作
    completeUnitOfWork(fiber);//可以结束此fiber的渲染了 
    if (fiber.sibling) {//如果它有弟弟就返回弟弟
      return fiber.sibling;
    }
    fiber = fiber.return;//如果没有弟弟让爸爸完成，然后找叔叔
  }
}
function beginWork(fiber) {
  console.log('beginWork', fiber.props.id);
  return fiber.child;//B1
}
function completeUnitOfWork(fiber) {
  console.log('completeUnitOfWork', fiber.props.id);
}
nextUnitOfWork = A1;
workLoop();