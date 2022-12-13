import * as React from "react"
import { createRoot } from "react-dom/client"

function FunctionComponent() {
  console.log("FunctionComponent")
  const [number, setNumber] = React.useState(0)
  //如果使用的是useState，调用setNumber的时候传入的是老状态，则不需要更新，
  return number === 0 ? (
    <div
      key="title1"
      id="title"
      onClick={() => {
        setNumber(number + 1)
      }}
    >
      title
    </div>
  ) : (
    <div
      key="title2"
      id="title2"
      onClick={() => {
        setNumber(number + 1)
      }}
    >
      title2
    </div>
  )
}
let element = <FunctionComponent />
//old let element = React.createElement(FunctionComponent);
//new let element = jsx(FunctionComponent);
const root = createRoot(document.getElementById("root"))
//把element虚拟DOM渲染到容器中
root.render(element)

//老fiber树 div#root对应的fiber.child=FunctionComponent的fiber.child=button.fiber
