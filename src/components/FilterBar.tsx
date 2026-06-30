"use client";

interface Props{

category:string;

setCategory:(value:string)=>void;

}

const categories=[

"All",

"Vegetables",

"Grains"

];

export default function FilterBar({

category,

setCategory

}:Props){

return(

<div className="flex gap-3 flex-wrap">

{

categories.map((item)=>(

<button

key={item}

onClick={()=>setCategory(item)}

className={`

px-5

py-2

rounded-full

transition

${

category===item

?

"bg-green-600 text-white"

:

"bg-green-100 hover:bg-green-200"

}

`}

>

{item}

</button>

))

}

</div>

);

}
