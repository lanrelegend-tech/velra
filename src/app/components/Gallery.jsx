
function Gallery() {
  return (
    <div className="w-full flex flex-col md:flex-row">

      {/* Left image */}
      <div className="w-full md:w-1/2 h-screen">
        <img
          src="/model6.jpg"
          alt="gallery 1"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right image */}
      <div className="w-full md:w-1/2 h-screen">
        <img
          src="/model03.jpg"
          alt="gallery 2"
          className="w-full h-full object-cover"
        />
      </div>

    </div>
  );
}

export default Gallery;