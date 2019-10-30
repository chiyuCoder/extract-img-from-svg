import * as path from "path";

export interface ConfigItem {
    svg?: string;
    output?: string;
}

export interface Configure {
    [attr: string]: ConfigItem;
}

export const config: Configure = {
    "index-svg": {
        svg: path.resolve(__dirname, "../src/index-svg.svg"),
        output: path.resolve(__dirname, "../dist")
    }
};
