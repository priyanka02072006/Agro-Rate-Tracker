import {
  BarChart3,
  Brain,
  Globe,
  Search,
  Bell,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Real-Time Charts",
    desc: "Interactive charts showing agricultural price trends.",
  },
  {
    icon: Brain,
    title: "AI Prediction",
    desc: "Forecast future crop prices using intelligent models.",
  },
  {
    icon: Globe,
    title: "Multiple Languages",
    desc: "Switch between English and Indian regional languages.",
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Find products instantly using powerful filters.",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    desc: "Receive notifications when prices change significantly.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable Data",
    desc: "Clean and structured market information from trusted sources.",
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-green-50">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center">
          Powerful Features
        </h2>

        <p className="text-center text-gray-500 mt-5 max-w-3xl mx-auto">
          Everything you need to monitor agricultural markets in one place.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (

              <div
                key={feature.title}
                className="bg-white rounded-3xl p-8 shadow hover:shadow-2xl transition"
              >

                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">

                  <Icon className="text-green-600"/>

                </div>

                <h3 className="text-2xl font-semibold mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-7">
                  {feature.desc}
                </p>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}
