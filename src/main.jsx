import * as React from "react"
import { createRoot } from "react-dom/client"
function FunctionComponent() {
  const [number, setNumber] = React.useState(0)
  return (
    <button
      onClick={() => {
        debugger
        setNumber((number) => number + 1)
        setNumber((number) => number + 2)
        setNumber(number + 1)
      }}
    >
      {number}
    </button>
  )
}
const element = <FunctionComponent />
const container = document.getElementById("root")
const root = createRoot(container)
root.render(element)
