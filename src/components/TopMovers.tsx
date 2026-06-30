import { ArrowUp, ArrowDown } from "lucide-react";

const gainers = [
  { name: "Onion", change: "+7.4%" },
  { name: "Tomato", change: "+5.2%" },
  { name: "Carrot", change: "+4.1%" },
];

const losers = [
  { name: "Potato", change: "-2.8%" },
  { name: "Wheat", change: "-1.3%" },
];

export default function TopMovers() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">

      <h2 className="text-2xl font-bold mb-8">
        Top Market Movers
      </h2>

      <div className="space-y-8">

        <div>

          <h3 className="font-semibold text-green-600 mb-4">
            Top Gainers
          </h3>

          {gainers.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center py-3 border-b"
            >
              <span>{item.name}</span>

              <span className="flex items-center gap-2 text-green-600 font-semibold">

                <ArrowUp size={18} />

                {item.change}

              </span>
            </div>
          ))}

        </div>

        <div>

          <h3 className="font-semibold text-red-500 mb-4">
            Top Losers
          </h3>

          {losers.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center py-3 border-b"
            >
              <span>{item.name}</span>

              <span className="flex items-center gap-2 text-red-500 font-semibold">

                <ArrowDown size={18} />

                {item.change}

              </span>
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}
