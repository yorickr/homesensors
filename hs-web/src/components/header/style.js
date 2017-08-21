import React, {StyleSheet, Dimensions, PixelRatio} from "react-native";
const {width, height, scale} = Dimensions.get("window"),
    vw = width / 100,
    vh = height / 100,
    vmin = Math.min(vw, vh),
    vmax = Math.max(vw, vh);

export default StyleSheet.create({
    "header": {
        "backgroundColor": "#222",
        "height": "10%",
        "paddingTop": 20,
        "paddingRight": 20,
        "paddingBottom": 20,
        "paddingLeft": 20,
        "color": "white"
    }
});