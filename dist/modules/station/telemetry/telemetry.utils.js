"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUvIndex = exports.calculateHeatIndex = void 0;
const calculateHeatIndex = (humidity, temperature) => {
    //convert celsius to fahrenheit
    const tempFah = (temperature * 9) / 5 + 32;
    const c1 = -42.379;
    const c2 = 2.04901523;
    const c3 = 10.14333127;
    const c4 = -0.22475541;
    const c5 = -6.83783 * Math.pow(10, -3);
    const c6 = -5.481717 * Math.pow(10, -2);
    const c7 = 1.22874 * Math.pow(10, -3);
    const c8 = 8.5282 * Math.pow(10, -4);
    const c9 = -1.99 * Math.pow(10, -6);
    const calculateHeatIndex = c1 +
        c2 * tempFah +
        c3 * humidity +
        c4 * tempFah * humidity +
        c5 * tempFah * tempFah +
        c6 * humidity * humidity +
        c7 * tempFah * tempFah * humidity +
        c8 * tempFah * humidity * humidity +
        c9 * tempFah * tempFah * humidity * humidity;
    //calculate heat index to celsius
    const heatIndex = ((calculateHeatIndex - 32) * 5) / 9;
    return parseFloat(heatIndex.toFixed(2));
};
exports.calculateHeatIndex = calculateHeatIndex;
const calculateUvIndex = (uvIntensity) => {
    const thresholds = [
        50, 227, 318, 408, 503, 606, 696, 795, 881, 976, 1079, 1169,
    ];
    if (uvIntensity < thresholds[0]) {
        return 0;
    }
    for (let i = 0; i < thresholds.length; i++) {
        if (i === thresholds.length - 1 || uvIntensity < thresholds[i + 1]) {
            return i;
        }
    }
    return thresholds.length - 1;
};
exports.calculateUvIndex = calculateUvIndex;
