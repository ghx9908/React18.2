let existingChildren = new Map();
existingChildren.set('B', 'B_Fiber');
existingChildren.set('C', 'C_Fiber');
existingChildren.set('D', 'D_Fiber');
existingChildren.set('E', 'E_Fiber');
existingChildren.set('F', 'BF_Fiber');
let lastPlacedIndex = 0;
let newChildren = ['C', 'E', 'B', 'G', 'D'];
for (let i = 0; i < newChildren.length; i++) {
  let newChild = newChildren[i];
  let exist = existingChildren.get(newChild);
  if (exist) {
    //复用C
    existingChildren.delete(newChild);
  }
}