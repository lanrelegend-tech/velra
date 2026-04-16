import Image from "next/image";
import Landingpage from "./components/Landingpage";
import Newcollections from "./components/Newcollections";
import Gallery from "./components/Gallery";
import Femalecloths from "./components/Femalecloths";
import Galleryphoto from "./components/Galleryphtot";

export default function Home() {
  return (
    <div>
      <Landingpage/>
      <Newcollections/>
      <Gallery/>
      <Femalecloths/>
      <Galleryphoto/>
    </div>
  );
}
