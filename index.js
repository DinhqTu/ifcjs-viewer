import { IfcBoundaryCondition } from "web-ifc";
import { createCardDiv } from "./overlay.js";
import { projects } from "./projects.js";

for (let proj of projects) {
  createCardDiv(proj.name, proj.id);
}

const input = document.getElementById("file-input");
input.addEventListener("change", (changed) => {
  const file = changed.target.files[0];
  // var ifcURL = URL.createObjectURL(file);
  console.log(file);
});
