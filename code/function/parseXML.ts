export namespace StXML {
    export interface StAttr {
        [attr: string]: string | boolean;
    }

    export interface StAttrMap {
        name: string;
        value: string | boolean;
    }

    export interface BaseNode {
        tagName: string;
        attrsList: StAttrMap[];
        attrMap: StAttr;
        parent: BaseNode;
        children: Node[];
        isText: false;
    }
    export interface TextNode {
        isText: true;
        text: string;
        parent: BaseNode;
    }
    export type Node = BaseNode | TextNode;
}
const tagNameReg = `\\w\\-\\.`

function createNodeByTagName(tagName: string): StXML.BaseNode {
    return {
        tagName,
        attrsList: [],
        attrMap: {},
        parent: null,
        children: [],
        isText: false,
    };
}

function createTextNode(text: string): StXML.TextNode {
    return {
        isText: true,
        text,
        parent: null,
    };
}

function matchNodeStart(xml: string) {
    const reg = new RegExp(`^\\<([${tagNameReg}]+)`);
    const result = xml.match(reg);
    if (result) {
        return {
            node: createNodeByTagName(result[1]),
            len: result[0].length
        };
    } else {
        return false;
    }
}



function matchNodeEnd(xml: string) {
    const reg = new RegExp(`^\\<\\/[${tagNameReg}]+\\>`);
    const result = xml.match(reg);
    if (result) {
        return {
            len: result[0].length,
        };
    }
    return false;
}

function matchStartEnd(xml: string) {
    const reg = /^(\/)?\>/;
    const result = xml.match(reg);
    if (result) {
        return {
            selfClosed: !!result[1],
            len: result[0].length,
        }
    }
    return false;
}

function matchTextNode(xml: string) {
    const reg = /^([^<]+)/
    const result = xml.match(reg);
    if (result) {
        return {
            len: result[0].length,
            text: result[1]
        };
    }
    return false;
}

function matchAttr(xml: string) {
    let reg = /^([\w\-:\.\@]+)\s*=\s*(?:"([^"]+)"|'([^']+)')/;
    let result = xml.match(reg);
    if (result) {
        return {
            attr: {
                name: result[1],
                value: result[2],
            },
            len: result[0].length,
        };
    }
    reg = /^([\w\-:\.\@]+)/;
    result = xml.match(reg);
    if (result) {
        return {
            attr: {
                name: result[1],
                value: true,
            },
            len: result[0].length,
        };
    }
    return false;
}

export function parseXML(xml: string) {
    xml = xml.trim();
    let nowNode: StXML.BaseNode;
    let root: StXML.BaseNode;
    let inNodeStart: boolean = false;
    while (xml && xml.length) {
        xml = xml.trim();
        const start = matchNodeStart(xml);
        if (start) { // <...
            xml = xml.slice(start.len);
            start.node.parent = nowNode;
            if (nowNode && nowNode.children) {
                nowNode.children.push(start.node);
            }
            nowNode = start.node;
            if (!root) {
                root = nowNode;
            }
            xml = xml.trim();
            inNodeStart = true;

            // console.log(xml.length)
            // xml = ''
        }
        else {
            if (inNodeStart) {
                const startEnd = matchStartEnd(xml);
                if (startEnd) {
                    xml = xml.slice(startEnd.len);
                    inNodeStart = false;
                    if (startEnd.selfClosed) {
                        nowNode = nowNode.parent as StXML.BaseNode;
                    }
                    xml = xml.trim();
                } else {

                    const attrMatch = matchAttr(xml);
                    if (attrMatch) {
                        xml = xml.slice(attrMatch.len);
                        nowNode.attrsList.push(attrMatch.attr);
                        nowNode.attrMap[attrMatch.attr.name] = attrMatch.attr.value;
                        xml = xml.trim();
                    } else {

                        console.error(`123has error:\n${xml.slice(0, 100)}`);
                        console.log(nowNode);
                        throw new Error('--')
                    }
                }

                // xml.trim();
                // continue;
            } else {
                const nodeEnd = matchNodeEnd(xml);
                if (nodeEnd) {
                    nowNode = nowNode.parent as StXML.BaseNode;
                    xml = xml.slice(nodeEnd.len);
                    xml = xml.trim();
                } else {
                    const textRes = matchTextNode(xml);
                    if (textRes) {
                        xml = xml.slice(textRes.len);
                        const textNode = createTextNode(textRes.text);
                        textNode.parent = nowNode;
                        nowNode.children.push(textNode);
                        xml = xml.trim();
                    } else {

                        console.error(`223has error: \n ${xml.slice(0, 100)}`);
                        console.log(nowNode);
                        throw new Error('--')
                    }
                }
            }
        }
    }

    return root;
}
