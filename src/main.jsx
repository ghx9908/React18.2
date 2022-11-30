import { createRoot } from "react-dom/client"
function FunctionComponent() {
  return (
    <h1
      onClick={(event) => console.log("onClick h1", event.type)}
      onClickCapture={(event) => console.log("onClickCapture h1", event.type)}
    >
      hello
      <span
        style={{ color: "red" }}
        onClick={(event) => {
          event.stopPropagation()
          console.log("onClick span", event.type)
        }}
        onClickCapture={(event) => {
          console.log("onClickCapture span", event.type)
        }}
      >
        world
      </span>
    </h1>
  )
}
let element = <FunctionComponent />

const root = createRoot(document.getElementById("root"))
root.render(element)
