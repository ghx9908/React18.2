import { createRoot } from "react-dom/client"
function FunctionComponent() {
  return (
    <h1
      onClick={() => console.log("onClick h1")}
      onClickCapture={() => console.log("onClickCapture h1")}
    >
      hello
      <span
        style={{ color: "red" }}
        onClick={() => console.log("onClick span")}
        onClickCapture={() => console.log("onClickCapture span")}
      >
        world
      </span>
    </h1>
  )
}
let element = <FunctionComponent />

const root = createRoot(document.getElementById("root"))
root.render(element)
