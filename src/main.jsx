import * as React from "react"
import { createRoot } from "react-dom/client"

let counter = 0
let timer
let bCounter = 0
let cCounter = 0
function FunctionComponent() {
  const [numbers, setNumbers] = React.useState(new Array(100).fill("A"))
  const divRef = React.useRef()
  const updateB = (numbers) => new Array(100).fill(numbers[0] + "B")
  updateB.id = "updateB" + bCounter++
  const updateC = (numbers) => new Array(100).fill(numbers[0] + "C")
  updateC.id = "updateC" + cCounter++
  React.useEffect(() => {
    timer = setInterval(() => {
      divRef.current.click() //1
      if (counter++ === 0) {
        setNumbers(updateB) //16
      }
      divRef.current.click() //1
      if (counter++ > 100) {
        clearInterval(timer)
      }
    })
  }, [])
  return (
    <div
      ref={divRef}
      onClick={() => {
        setNumbers(updateC)
      }}
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  )
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"))
root.render(element)
