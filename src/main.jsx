import * as React from "react"
import { createRoot } from "react-dom/client"
function counter(state, action) {
  if (action.type === "add") return state + action.payload
  return state
}
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0)
  return (
    <button
      onClick={() => {
        setNumber({ type: "add", payload: 1 })
      }}
    >
      {number}
    </button>
  )
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"))
root.render(element)
