import type { Config } from "tailwindcss";

const config: Config = {

darkMode:["class"],

content:[

"./src/**/*.{ts,tsx}",

],

theme:{

extend:{

colors:{

primary:"#3FA34D",

secondary:"#FFD166",

accent:"#2D6A4F"

}

}

},

plugins:[require("tailwindcss-animate")]

}

export default config;
