import turf from "turf";
import transformTranslate from "@turf/transform-translate";
import {saveJSON} from "./csvloader";
import fs from "fs";
import transformation from "transform-coordinates";

//const wallWidth = 50;
const wallWidth = 0.5;
const output = "outputs";

function shiftPolygonFeature(feature: any) {
    if (feature.type === "Feature" && feature.geometry.type === "Polygon") {
        const coordinates = feature.geometry.coordinates;
        const bottomLeft = coordinates[0][1];
        const bottomRight = coordinates[0][2];

        const from = turf.point(bottomLeft);
        const to = turf.point(bottomRight);

//        const distance = turf.distance(from, to, "meters");
        const bearing = turf.bearing(from, to);
        const polygonFeature = turf.polygon(coordinates);
        const translatedPoly = transformTranslate(polygonFeature, wallWidth,bearing-90, {units: "meters"} );
        return translatedPoly;
    }
}

export function decodeFeatureCollection(featureCollection: any) {

    const features = featureCollection.features;

    for (const feature of features) {
        const targetFeature1 = reprojectPolygonFeature(feature);
        console.log("Original :", JSON.stringify(feature));
        console.log("Target :", JSON.stringify(targetFeature1));
        saveJSON(targetFeature1, "polygon25832.geojson")

        const polygonFeature= shiftPolygonFeature(feature);
        const targetFeature2 = reprojectPolygonFeature(polygonFeature);

        createObjFile(`${output}/myobj.obj`, targetFeature1, targetFeature2);
        saveJSON(polygonFeature, `${output}/polygon_shifted.geojson`);
        saveJSON(targetFeature2, `${output}/polygon_shifted_25832.geojson`);
    }

}

function reprojectPolygonFeature(polygonFeature) {
    const transform = transformation('EPSG:4326', 'EPSG:25832');
    const newFeature = JSON.parse(JSON.stringify(polygonFeature));


    const coordinates = polygonFeature.geometry.coordinates[0];

    newFeature.crs = {
        "type": "name",
            "properties": {
            "name": "EPSG:25832"
        }
    };


    const scale = 1;
    const x= 0 ;
    const y= 0;

    for (let i=0; i<coordinates.length; ++i) {
        const coordinate = coordinates[i];

        const txCoordinates = transform.forward({x: coordinate[0], y: coordinate[1], z: coordinate[2]})
        newFeature.geometry.coordinates[0][i] = [(txCoordinates.x-x)*scale, (txCoordinates.y-y)*scale, txCoordinates.z];
    }
    return newFeature;
}


function getVertices(feature: any) {
    const verrtices =  [...feature.geometry.coordinates[0]];
    verrtices.pop();
    return verrtices;
}
function createObjFile(objFilename: string, feature: any, polygonFeature: any) {
    let content = "";
    const version = "v1.0.0";
    const maker = "Felipe Carrillo";
    const shapeName = "Cube.005";
    const mtlfile = "material.mtl";
    const baseTexture = "Base";
    const orthoTexture = "Ortho";



    const vertices1 = getVertices(feature);
    const vertices2 = getVertices(polygonFeature);

    content +=
        `# OBJLoader ${version} OBJ File: \n` +
        `# by ${maker} \n` +
        `mtllib ${mtlfile} \n` +
        `o ${shapeName} \n`;


    for (const vertice  of vertices1) {
        const [x,y,z] = vertice;
        content += `v ${x} ${y} ${z} \n`
    }

    for (const vertice  of vertices2.reverse()) {
        const [x,y,z] = vertice;
        content += `v ${x} ${y} ${z} \n`
    }

    const vts = getVTs();

    for (const vt  of vts) {
        const [x,y,z] = vt;
        content += `vt ${x} ${y} \n`
    }

    content += `usemtl ${orthoTexture} \n` +
    "f 1/1 2/2 3/3 4/4 \n" +
    `usemtl ${baseTexture} \n`+
    "f 5/1 6/2 7/3 8/4 \n"+
    "f 3/1 4/2 5/3 6/4 \n"+
    "f 1/1 4/2 5/3 8/4 \n"+
    "f 1/1 2/2 7/3 8/4 \n"+
    "f 2/1 3/2 6/3 7/4 \n";


    fs.writeFileSync(objFilename, content);
}

function getVTs() {
    const vts = [
        [0.000000, 1.000000],
        [ 0.000000, 0.000000],
        [ 1.000000, 0.000000],
        [1.000000, 1.000000],
        ]
    return vts;
}
