import type { ICellRendererParams } from "ag-grid-community";
import jsonFormatter from "./jsonFormatter";

function JSONCellRenderer(props: ICellRendererParams) {
  return (
    <span
      innerHTML={jsonFormatter.format(props.value, {
        keyColor: "black",
        numberColor: "blue",
        stringColor: "#0B7500",
        trueColor: "#00cc00",
        falseColor: "#ff8080",
        nullColor: "cornflowerblue",
      })}
    ></span>
  );
}

export default JSONCellRenderer;
