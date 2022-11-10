let tree = {
  name: "A",
  left: {
    name: "B",
    left: { name: "B1" },
    right: { name: "B2" },
  },
  right: {
    name: "C",
    left: { name: "C1" },
    right: { name: "C2" },
  },
}
function dfs(node) {
  //前序
  node.left && dfs(node.left)
  console.log(node.name)
  //中序
  node.right && dfs(node.right)
  //后序
}
dfs(tree)
