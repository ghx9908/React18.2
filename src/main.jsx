import { createRoot } from "react-dom/client"
let element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
)

const root = createRoot(document.getElementById("root"))
root.render(element)
