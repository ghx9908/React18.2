import * as React from "react"
import { createRoot } from "react-dom/client"

let element = <h1>hello</h1>
const root = createRoot(document.getElementById("root"))
root.render(element)
