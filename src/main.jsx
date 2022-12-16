import * as React from "react"
import { createRoot } from "react-dom/client"

function FunctionComponent() {
  const [number, setNumber] = React.useState(0)
  React.useEffect(() => {
    console.log("useEffect1")
    return () => {
      console.log("destroy useEffect1")
    }
  })
  React.useLayoutEffect(() => {
    console.log("useLayoutEffect2")
    return () => {
      console.log("destroy useLayoutEffect2")
    }
  })
  React.useEffect(() => {
    console.log("useEffect3")
    return () => {
      console.log("destroy useEffect3")
    }
  })
  React.useLayoutEffect(() => {
    console.log("useLayoutEffect4")
    return () => {
      console.log("destroy useLayoutEffect4")
    }
  })
  return <button onClick={() => setNumber(number + 1)}>{number}</button>
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"))
root.render(element)
