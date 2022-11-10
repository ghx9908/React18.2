import { createRoot } from "react-dom/client"
let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
)
debugger
const root = createRoot(document.getElementById("root"))
console.log("root=>", root)
//root.render(element)
