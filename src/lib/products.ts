export interface Product {
  id: number;
  name: string;
  category: string;
  market: string;
  price: number;
  change: number;
  image: string;
  trend: number[];
}

export const products:Product[]=[

{
  id:1,
  name:"Tomato",
  category:"Vegetables",
  market:"Chennai",
  price:42,
  change:2.3,
  image:"🍅",
  trend:[35,36,38,39,41,42]
},

{
id:2,
name:"Potato",
category:"Vegetables",
market:"Madurai",
price:36,
change:-1.2,
image:"🥔",
trend:[30,31,34,33,35,36]
},

{
id:3,
name:"Onion",
category:"Vegetables",
market:"Coimbatore",
price:58,
change:4.5,
image:"🧅",
trend:[42,45,48,52,55,58]
},

{
id:4,
name:"Rice",
category:"Grains",
market:"Salem",
price:72,
change:0.8,
image:"🌾",
trend:[65,66,68,69,70,72]
},

{
id:5,
name:"Wheat",
category:"Grains",
market:"Trichy",
price:64,
change:-0.6,
image:"🌾",
trend:[60,61,61,62,63,64]
},

{
id:6,
name:"Carrot",
category:"Vegetables",
market:"Erode",
price:49,
change:3.8,
image:"🥕",
trend:[40,42,43,45,47,49]
}

];
