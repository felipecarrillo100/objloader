import { parse } from "csv-parse";
import * as fs from "fs";
export function loadCSVFile(filename: string) {
    return new Promise<any[]>(resolve=> {
        const data: any[] = [];
        fs.createReadStream(filename)
            .pipe(
                parse({
                    delimiter: ",",
                    columns: true,
                    ltrim: true,
                    rtrim: true,
                })
            )
            .on("data", function (row) {
                // This will push the object row into the array
                data.push(row);
            })
            .on("error", function (error) {
                console.log(error.message);
            })
            .on("end", function () {

                for (const row of data) {
                    for (const key in row) {
                        if (row.hasOwnProperty(key)) {
                            const newKey =  key.trim();
                            if (newKey!==key) {
                                row[newKey]  = row[key];
                                delete row[key];
                            }
                        }
                    }
                }

                const left_top = data.find(e=>e.name==="left_top");
                const left_bottom = data.find(e=>e.name==="left_bottom");
                const right_bottom = data.find(e=>e.name==="right_bottom");
                const right_top = data.find(e=>e.name==="right_top");
                const sortedBounds = [left_top, left_bottom, right_bottom, right_top, left_top];

                resolve(sortedBounds);
            });
    })
}

export function produceFeatureCollection(filename: string) {
    return new Promise(resolve=>{
        loadCSVFile(filename).then(rows=>{
            const featureCollection = {
                "type": "FeatureCollection",
                "features": [] as any[]
            }
            const feature = {
                "type": "Feature",
                "properties": {
                    "texture": "texture.png"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[]] as any[][]
                }
            }
            featureCollection.features.push(feature);

            for (const row of rows) {
                const coordinate = [Number(row.wgs84_lon), Number(row.wgs84_lat),Number(row.wgs84_elev)];
                feature.geometry.coordinates[0].push(coordinate);
            }
            resolve(featureCollection);
        })
    })
}

export function saveJSON(featureCollection: any, filename: string ) {
    let dataGeoJson = JSON.stringify(featureCollection);
    fs.writeFileSync(filename, dataGeoJson);
}

