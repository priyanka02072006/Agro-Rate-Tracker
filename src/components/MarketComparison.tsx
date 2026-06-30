const markets = [
  {
    market: "Chennai",
    tomato: 42,
    onion: 58,
    potato: 36,
  },
  {
    market: "Madurai",
    tomato: 45,
    onion: 56,
    potato: 38,
  },
  {
    market: "Coimbatore",
    tomato: 41,
    onion: 60,
    potato: 37,
  },
  {
    market: "Salem",
    tomato: 43,
    onion: 57,
    potato: 35,
  },
];

export default function MarketComparison() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">

      <h2 className="text-2xl font-bold mb-8">
        Market Comparison
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-4">Market</th>
              <th>Tomato</th>
              <th>Onion</th>
              <th>Potato</th>

            </tr>

          </thead>

          <tbody>

            {markets.map((item) => (

              <tr
                key={item.market}
                className="border-b hover:bg-green-50"
              >

                <td className="py-4 font-semibold">
                  {item.market}
                </td>

                <td className="text-center">
                  ₹{item.tomato}
                </td>

                <td className="text-center">
                  ₹{item.onion}
                </td>

                <td className="text-center">
                  ₹{item.potato}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
