import * as React from "react"
import { createRoot } from "react-dom/client"
function counter(state, action) {
  if (action.type === "add") return state + action.payload
  return state
}
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0)
  const [number2, setNumber2] = React.useReducer(counter, 0)
  return (
    <button
      onClick={() => {
        setNumber({ type: "add", payload: 1 }) //update1=>update2=>update3=>update1
        setNumber({ type: "add", payload: 1 }) //update2
        setNumber({ type: "add", payload: 1 }) //update3
      }}
    >
      {number}
    </button>
  )
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"))
root.render(element)
