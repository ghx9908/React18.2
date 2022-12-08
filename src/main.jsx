import * as React from "react"
import { createRoot } from "react-dom/client"
function counter(state, action) {
  if (action.type === "add") return state + action.payload
  return state
}
function FunctionComponent() {
  const [number, setNumber] = React.useReducer(counter, 0)
  let attrs = { id: "btn1" }
  if (number === 6) {
    delete attrs.id
    attrs.style = { color: "red" }
  }
  return (
    <button
      {...attrs}
      onClick={() => {
        setNumber({ type: "add", payload: 1 }) //update1=>update2=>update3=>update1
        setNumber({ type: "add", payload: 2 }) //update2
        setNumber({ type: "add", payload: 3 }) //update3
      }}
    >
      {number}
    </button>
  )
}
let element = <FunctionComponent />
//old let element = React.createElement(FunctionComponent);
//new let element = jsx(FunctionComponent);
const root = createRoot(document.getElementById("root"))
//把element虚拟DOM渲染到容器中
root.render(element)

//老fiber树 div#root对应的fiber.child=FunctionComponent的fiber.child=button.fiber
