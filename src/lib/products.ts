export interface Product {

  id:number;

  name:string;

  category:string;

  market:string;

  price:number;

  change:number;

  image:string;

}

export const products:Product[]=[

{
id:1,
name:"Tomato",
category:"Vegetables",
market:"Chennai",
price:42,
change:2.3,
image:"🍅"
},

{
id:2,
name:"Potato",
category:"Vegetables",
market:"Madurai",
price:36,
change:-1.2,
image:"🥔"
},

{
id:3,
name:"Onion",
category:"Vegetables",
market:"Coimbatore",
price:58,
change:4.5,
image:"🧅"
},

{
id:4,
name:"Rice",
category:"Grains",
market:"Salem",
price:72,
change:0.8,
image:"🌾"
},

{
id:5,
name:"Wheat",
category:"Grains",
market:"Trichy",
price:64,
change:-0.6,
image:"🌾"
},

{
id:6,
name:"Carrot",
category:"Vegetables",
market:"Erode",
price:49,
change:3.8,
image:"🥕"
}

];
