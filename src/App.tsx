import Globe from "./components/Globe";
import Sidebar from "./components/SidePanel";

export default function App() {
  return (
    <div className="flex w-screen h-screen bg-gray-950 text-white">
      <div className="flex w-full h-full">
        <Globe />
      </div>
      <div className="absolute bottom-0 right-0 h-auto w-[30rem] border-l border-gray-800 bg-gray-900/80 p-4 overflow-y-auto">
        <Sidebar />
      </div>
    </div>
  );
}
