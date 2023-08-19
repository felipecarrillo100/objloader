import {produceFeatureCollection, saveJSON} from "./loader/csvloader";
import {decodeFeatureCollection} from "./loader/generatevertices";
import {toPng} from "./loader/imageprocessing";

toPng("inputs/orthomosaic_front.tif", "outputs/texture.jpg", 0.1).then((result)=>{
   console.log("Result", result);

    produceFeatureCollection("./inputs/ecken.csv").then(collection=>{
        decodeFeatureCollection(collection);
    });
})

