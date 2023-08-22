/*import { Scene } from "three";

import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import {
  createCheckboxes,
  createIfcTreeMenu,
  createIfcPropertyMenu,
  toolbarBottom,
  toolbarTop,
  createHelpInfo,
} from "./overlay.js";

import { projects } from "./projects.js";

import {
  //need to load additional ifc entities or remove filter
  IFCWALL,
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCDOOR,
  IFCWINDOW,
  IFCFURNISHINGELEMENT,
  IFCMEMBER,
  IFCPLATE,
  IFCSPACE,
  IFCSITE,
  IFCROOF,
  IFCBUILDINGELEMENTPROXY,
} from "web-ifc";

// List of categories names
const categories = {
  IFCWALL,
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER,
  IFCSPACE,
  IFCSITE,
  IFCROOF,
  IFCBUILDINGELEMENTPROXY,
};

const container = document.getElementById("viewer-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(255, 255, 255),
});

viewer.axes.setAxes(); // tạo gốc tạo độ x, y, z
// viewer.grid.setGrid(); // tạo lưới
console.log(viewer);
// get id trên url -> ss với id của project -> load model
const currentUrl = window.location.href;
const url = new URL(currentUrl);
const currentProjectID = url.searchParams.get("id"); //bimserver project id - use this to get latest revision etc

async function loadIfc(url) {
  // Load the model
  const model = await viewer.IFC.loadIfcUrl(url);
  console.log("model", model);

  // Add dropped shadow and post-processing efect
  await viewer.shadowDropper.renderShadow(model.modelID);
  viewer.context.renderer.postProduction.active = true;

  model.removeFromParent(); //for ifc categories filter

  const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);

  await setupAllCategories(); //for ifc categories filter
  createTreeMenu(ifcProject);
}

const scene = viewer.context.getScene(); //for showing/hiding categories

let path;

for (let proj of projects) {
  if (proj.id === currentProjectID) {
    let fileName = proj.name;
    path = "./models/" + fileName + ".ifc"; // get path into this
    console.log(path);
  }
}

loadIfc(path);

// create UI elements

createIfcPropertyMenu();

const propsGUI = document.getElementById("ifc-property-menu-root");

// tạo ra các button click trong models
createIfcTreeMenu();
createCheckboxes(); // checkbox -> hide property
createHelpInfo(); // display info about button
toolbarTop();
toolbarBottom();

//select IFC elements
window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();

window.ondblclick = async () => {
  const result = await viewer.IFC.selector.pickIfcItem(); //highlight IfcItem hides all other elements
  if (!result) return;
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  console.log("properties", props);
  createPropertiesMenu(props);

  document.getElementById("ifc-property-menu").style.display = "initial";
  propertiesButton.classList.add("active");

  if (clippingPlanesActive) {
    viewer.clipper.createPlane(); // tạo một mặt phẳng để cắt hình 3D
  }

  if (measurementsActive) {
    // phương thức tạo các kích thước trên mô hình 3D. Giúp đo lường và hiển thị các kích thước của phần tử trong mô hình
    viewer.dimensions.create();
  }
};

//set up clipping planes
const clipButton = document.getElementById("clipPlaneButton");

let clippingPlanesActive = false;
clipButton.onclick = () => {
  clippingPlanesActive = !clippingPlanesActive;
  viewer.clipper.active = clippingPlanesActive;

  if (clippingPlanesActive) {
    //add or remove active class depending on whether button is clicked and clipping planes are active
    clipButton.classList.add("active");
  } else {
    clipButton.classList.remove("active");
  }
};

// bắt sự kiện khi user nhấn chuột phải or con lăn
window.onauxclick = () => {
  if (clippingPlanesActive) {
    viewer.clipper.createPlane();
  }

  if (measurementsActive) {
    viewer.dimensions.create();
  }
};

window.onkeydown = (event) => {
  if (event.code === "Delete" && clippingPlanesActive) {
    // viewer.clipper.deletePlane();
    viewer.clipper.deleteAllPlanes();
  }

  if (event.code === "Delete" && measurementsActive) {
    viewer.dimensions.delete();
  }
};

//notes / annotations

const annotationsButton = document.getElementById("annotationsButton");
let measurementsActive = false;

// toggle đo khoảng cách
annotationsButton.onclick = () => {
  viewer.dimensions.active = true;
  viewer.dimensions.previewActive = true;
  measurementsActive = !measurementsActive;

  if (measurementsActive) {
    annotationsButton.classList.add("active");
  } else {
    annotationsButton.classList.remove("active");
    viewer.dimensions.active = false;
    viewer.dimensions.previewActive = false;
  }
};

//help button
//const helpButton = document.getElementById("help-button");

//IFC tree view
const toggler = document.getElementsByClassName("caret");
for (let i = 0; i < toggler.length; i++) {
  toggler[i].onclick = () => {
    toggler[i].parentElement
      .querySelector(".nested")
      .classList.toggle("tree-active");
    toggler[i].classList.toggle("caret-down");
  };
}

// hiding/filters

// Gets the name of a category
function getName(category) {
  const names = Object.keys(categories);
  return names.find((name) => categories[name] === category);
}

// Gets all the items of a category
async function getAll(category) {
  return viewer.IFC.loader.ifcManager.getAllItemsOfType(0, category, false);
}

// Creates a new subset containing all elements of a category

// highlight property when user cursor
async function newSubsetOfType(category) {
  const ids = await getAll(category);
  return viewer.IFC.loader.ifcManager.createSubset({
    modelID: 0,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString(),
  });
}

// Stores the created subsets
const subsets = {};

async function setupAllCategories() {
  const allCategories = Object.values(categories);
  for (let i = 0; i < allCategories.length; i++) {
    const category = allCategories[i];
    // console.log("category: ", category);
    await setupCategory(category);
  }
}

// Creates a new subset and configures the checkbox
async function setupCategory(category) {
  subsets[category] = await newSubsetOfType(category);
  setupCheckBox(category);
}

// Sets up the checkbox event to hide / show elements
function setupCheckBox(category) {
  const name = getName(category);
  // console.log("name categories ", name);
  const checkBox = document.getElementById(name);
  checkBox.addEventListener("change", (event) => {
    const checked = event.target.checked;
    const subset = subsets[category];
    if (checked) scene.add(subset);
    else subset.removeFromParent();
  });
}

// Spatial tree menu

function createTreeMenu(ifcProject) {
  const root = document.getElementById("tree-root");
  removeAllChildren(root);
  const ifcProjectNode = createNestedChild(root, ifcProject);
  ifcProject.children.forEach((child) => {
    constructTreeMenuNode(ifcProjectNode, child);
  });
}

function nodeToString(node) {
  return `${node.type} - ${node.expressID}`;
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
    createSimpleChild(parent, node);
    return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach((child) => {
    constructTreeMenuNode(nodeElement, child);
  });
}

function createNestedChild(parent, node) {
  const content = nodeToString(node);
  const root = document.createElement("li");
  createTitle(root, content);
  const childrenContainer = document.createElement("ul");
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
    title.parentElement
      .querySelector(".nested")
      .classList.toggle("tree-active");
    title.classList.toggle("caret-down");
  };
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement("li");
  childNode.classList.add("leaf-node");
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
    viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  };

  childNode.onclick = async () => {
    viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID], true);

    let idsArray = [node.expressID];

    const props = await viewer.IFC.getProperties(0, idsArray[0], true, false);
    //console.log(props); //call the function here
    createPropertiesMenu(props);
    document.getElementById("ifc-property-menu").style.display = "initial";
    propertiesButton.classList.add("active");
  };
}

//IFC properties menu functions
function createPropertiesMenu(properties) {
  removeAllChildren(propsGUI);

  delete properties.psets;
  delete properties.mats;
  delete properties.type;

  for (let key in properties) {
    createPropertyEntry(key, properties[key]);
  }
}

function createPropertyEntry(key, value) {
  const propContainer = document.createElement("div");
  propContainer.classList.add("ifc-property-item");

  if (value === null || value === undefined) value = "undefined";
  else if (value.value) value = value.value;

  const keyElement = document.createElement("div");
  keyElement.textContent = key;
  propContainer.appendChild(keyElement);

  const valueElement = document.createElement("div");
  valueElement.classList.add("ifc-property-value");
  valueElement.textContent = value;
  propContainer.appendChild(valueElement);

  propsGUI.appendChild(propContainer);
}

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// window.onauxclick = () => viewer.IFC.selector.highlightIfcItem();
const plusButton = document.getElementById("plus-button");

let plusActiveButton = false;
plusButton.onclick = async () => {
  plusActiveButton = !plusActiveButton;
  if (plusActiveButton) {
    //   fetch("./models/Duplex-A-MEP.ifc")
    //     .then((response) => response.text())
    //     .then((data) => {
    //       // This will send the file data to our LoadFileData method
    //       console.log("data", data);
    //       LoadFileData(data);
    //     });
    // await viewer.dropbox.loadDropboxIfc();

    // remove model
    // viewer.dispose();
    plusButton.classList.add("active");
  } else {
    plusButton.classList.remove("active");
  }
};

*/

/// MAPBOX
import {
  Matrix4,
  Vector3,
  DirectionalLight,
  AmbientLight,
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
} from "three";
import { IFCLoader } from "web-ifc-three/IFCLoader";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGluaHR1MDgwNjAxIiwiYSI6ImNsbGxwcnRlcTI4d28zY21rYmh6Z205eHQifQ.XyjAMhumCi9ztQYI-1jLSw";
const map = new mapboxgl.Map({
  container: "map", // chứa map
  style: "mapbox://styles/mapbox/streets-v11", // style url
  zoom: 17.48, // mức zoom
  center: [106.7188358, 10.7886464], // toạ độ khi map render lần đầu
  pitch: 75, // góc nghiêng của map
  bearing: -80, // góc quay của bản đồ
  antialias: true,
});

const modelOrigin = [106.7188358, 10.7886464];
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0.72, 0];

// translate to map coordinates
const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
  modelOrigin,
  modelAltitude
);

const modelTransform = {
  translateX: modelAsMercatorCoordinate.x,
  translateY: modelAsMercatorCoordinate.y,
  translateZ: modelAsMercatorCoordinate.z,
  rotateX: modelRotate[0],
  rotateY: modelRotate[1],
  rotateZ: modelRotate[2],
  scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
};

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({
  // here we inject our Three.js scene into Mapbox
  canvas: map.getCanvas(),
  antialias: true,
});
renderer.autoClear = false;

const customLayer = {
  id: "3d-model",
  type: "custom",
  renderingMode: "3d",

  onAdd: function () {
    //load model
    const ifcLoader = new IFCLoader();
    ifcLoader.ifcManager.setWasmPath("./");
    ifcLoader.load("./models/Duplex-A-MEP.ifc", function (model) {
      scene.add(model);
    });

    //add lighting
    const directionalLight = new DirectionalLight(0x404040);
    const directionalLight2 = new DirectionalLight(0x404040);
    const ambientLight = new AmbientLight(0x404040, 3);
    directionalLight.position.set(0, -70, 100).normalize();
    directionalLight2.position.set(0, 70, 100).normalize();

    scene.add(directionalLight, directionalLight2, ambientLight);
  },

  render: function (gl, matrix) {
    //apply model transformations
    const rotationX = new Matrix4().makeRotationAxis(
      new Vector3(1, 0, 0),
      modelTransform.rotateX
    );
    const rotationY = new Matrix4().makeRotationAxis(
      new Vector3(0, 1, 0),
      modelTransform.rotateY
    );
    const rotationZ = new Matrix4().makeRotationAxis(
      new Vector3(0, 0, 1),
      modelTransform.rotateZ
    );

    const m = new Matrix4().fromArray(matrix);
    const l = new Matrix4()
      .makeTranslation(
        modelTransform.translateX,
        modelTransform.translateY,
        modelTransform.translateZ
      )
      .scale(
        new Vector3(
          modelTransform.scale,
          -modelTransform.scale,
          modelTransform.scale
        )
      )
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    camera.projectionMatrix = m.multiply(l);
    renderer.resetState();
    renderer.render(scene, camera);
    map.triggerRepaint();
  },
};

map.on("style.load", () => {
  map.addLayer(customLayer, "waterway-label");
});
