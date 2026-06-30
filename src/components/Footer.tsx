import { Sprout } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white py-12">

      <div className="max-w-7xl mx-auto px-6">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

          <div className="flex items-center gap-3">

            <Sprout className="w-10 h-10"/>

            <div>

              <h2 className="text-2xl font-bold">
                Agro Rate Tracker
              </h2>

              <p className="text-green-200">
                Smart Agriculture Platform
              </p>

            </div>

          </div>

          <div className="text-green-200 text-center lg:text-right">

            © {new Date().getFullYear()} Agro Rate Tracker

            <br/>

            Built with ❤️ using Next.js

          </div>

        </div>

      </div>

    </footer>
  );
}
