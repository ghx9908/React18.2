import * as React from "react"
import { createRoot } from "react-dom/client"

function FunctionComponent() {
  console.log("FunctionComponent")
  const [numbers, setNumbers] = React.useState(new Array(10).fill("A"))
  React.useEffect(() => {
    setTimeout(() => {}, 10)
    setNumbers((numbers) => numbers.map((number) => number + "B"))
  }, [])
  return (
    <button
      onClick={() =>
        setNumbers((numbers) => numbers.map((number) => number + "C"))
      }
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </button>
  )
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"))
root.render(element)
