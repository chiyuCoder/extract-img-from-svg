import { Configure, ConfigItem } from '../config';
import { readFile, writeFile, write } from 'fs';
import { parseXML, StXML } from './parseXML';
import { join } from 'path';

function readSvgFile(pathname: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        readFile(pathname, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function jsonCopyXMLObj(obj: StXML.Node): any {
    if (obj.isText) {
        const textNode = obj as StXML.TextNode;
        return {
            text: textNode.text,
            isText: true,
        };
    }
    const baseNode = obj as StXML.BaseNode;
    return {
        tagName: baseNode.tagName,
        isText: false,
        children: baseNode.children.map(item => {
            return jsonCopyXMLObj(item);
        }),
        attrsList: baseNode.attrsList.filter(item => {
            return (baseNode.tagName != 'image') && (item.name != 'xlink:href')
        }).map(item => {
            return {
                name: item.name,
                value: item.value
            };
        }),
    };
}

let imgIndex = 0;

function copyImgFromBase64(data: string, filename: string) {
    const buffer = Buffer.from(data, "base64");
    writeFile(filename, buffer, (err) => {
        if (err) {
            console.error(`================>create image error @ ${new Date().toString()}============>`);
            console.error(err);
            console.log('img file name: ' + filename);
            console.error(`<================create image error @ ${new Date().toString()}<============`);
        }
    });
}

function travelAndExtractImgFrom(obj: StXML.Node, output: string, nodeIndex: number = 0) {
    nodeIndex++;
    if (obj.isText) {
        return false
    }
    const baseNode = obj as StXML.BaseNode;
    if (baseNode.tagName === 'image') {
        const base64Data = baseNode.attrMap["xlink:href"] as string;
        const typeReg = /^data:img\/(\w+);base64,(.+)/
        const typeResult = base64Data.match(typeReg);
        if (typeResult) {
            const imgName = `n-${imgIndex}_x-${parseInt(baseNode.attrMap.x as string) || 'x'}_y-${parseInt(baseNode.attrMap.y as string) || 'y'}_w-${parseInt(baseNode.attrMap.width as string) || 'w'}_h-${parseInt(baseNode.attrMap.height as string) || 'h'}.${typeResult[1]}`;
            imgIndex++;
            console.log(output)
            const filename = join(output, 'img', imgName);
            copyImgFromBase64(typeResult[2], filename);
            const xlink = "./img/" + imgName;
            baseNode.attrMap["xlink:href"] = xlink;
            baseNode.attrsList.forEach((attr, index) => {
                if (attr.name === "xlink:href") {
                    baseNode.attrsList[index].value = xlink
                }
            })
        } else {
            console.log(base64Data);
            process.exit(10)
        }
    } else {
        baseNode.children.map(item => {
            travelAndExtractImgFrom(item, output, nodeIndex);
        });
    }
}

function getXMLFromObj(obj: StXML.Node): string {
    if (obj.isText) {
        return obj.text;
    }
    const baseNode = obj as StXML.BaseNode
    return `<${baseNode.tagName} ${baseNode.attrsList.map(attr => {
        if (typeof attr.value === "boolean") {
            if (attr.value) {
                return attr.name;
            }
            return ''
        }
        return `${attr.name}="${attr.value}"`
    }).join(" ")}>${baseNode.children.map(node => {
        return getXMLFromObj(node);
    }).join("\n")}</${baseNode.tagName}>`;

}

function startParseXML(xml: string, name: string, output?: string) {
    const obj = parseXML(xml);

    if (!output) {
        output = join(__dirname, "../../dist/")
    }
    travelAndExtractImgFrom(obj, output);
    const text = getXMLFromObj(obj);
    const svgPath = join(output, name + '.svg');
    writeFile(svgPath, text, 'utf8', (err) => {
        if (err) {
            console.error(`================>create image error @ ${new Date().toString()}============>`);
            console.error(err);
            console.log('img file name: ' + svgPath);
            console.error(`<================create image error @ ${new Date().toString()}<============`);
        } else {

        }
    });
}

function start(config: ConfigItem, name: string) {
    readSvgFile(config.svg)
        .then((xml) => {
            try {
                startParseXML(xml, name, config.output);
            } catch (err) {
                console.error(err)
            }
        }).catch(err => {
            console.error(`================>read file error @ ${new Date().toString()}============>`);
            console.log(config.svg);
            console.error(`<================read file error @ ${new Date().toString()}<============`);
        })
}
export function readConfig(config: Configure) {
    for (let attr in config) {
        start(config[attr], attr);
    }
}