"use client";

interface Props{

value:string;

onChange:(value:string)=>void;

}

export default function SearchBar({

value,

onChange

}:Props){

return(

<input

value={value}

onChange={(e)=>onChange(e.target.value)}

placeholder="Search crops..."

className="w-full rounded-xl border border-gray-200 p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"

/>

);

}
