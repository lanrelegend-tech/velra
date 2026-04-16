
function Galleryphoto() {
  return (
    <div className="w-full flex flex-col md:flex-row mb-20">

      {/* Left image */}
      <div className="w-full md:w-1/2 h-screen">
        <img
          src="/gallery1.jpg"
          alt="gallery 1"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right image */}
      <div className="w-full md:w-1/2 h-screen">
        <img
          src="/gallery2.jpg"
          alt="gallery 2"
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
}

export default Galleryphoto;