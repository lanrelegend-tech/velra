function AboutPage() {
  return (
    <div className="w-full bg-white text-black font-sans">

      {/* HERO SECTION */}
<div
  className="relative h-screen flex items-center justify-center text-center px-10 bg-cover bg-center"
  style={{ backgroundImage: "url('/abt1.jpg')" }}
>
  {/* DARK OVERLAY */}
  <div className="absolute inset-0 bg-black/55"></div>

  {/* HERO TEXT */}
  <div className="relative z-10 text-white">

  <h1 className="font-[var(--font-playfair)] font-medium leading-none text-white"
  style={{ fontSize: "12vw", letterSpacing: "0.12em" }}
>
  VELRA
</h1>

    <p className="mt-12 text-base md:text-lg max-w-3xl mx-auto leading-8 text-gray-200 tracking-wide">
      A modern fashion identity built on simplicity, structure, and quiet confidence.
    </p>

  </div>
</div>
      {/* SECTION 1 (VIDEO + TEXT) */}
      <div className="px-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center mt-30 my-32">

        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-[500px] object-cover"
        >
          <source src="/video1.mp4" type="video/mp4" />
        </video>

        <div className="text-gray-700 leading-7 text-sm">
          <h2 className="text-xl mb-4 text-black tracking-widest">
            OUR BEGINNING
          </h2>

          <p>
            VELRA started with a simple idea — create clothing that feels clean,
            modern, and intentional. We focus on pieces that speak through design,
            not excess.
          </p>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="px-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center mb-32">

        <div className="text-gray-700 leading-7 text-sm order-2 md:order-1">
          <h2 className="text-xl mb-4 text-black tracking-widest">
            DESIGN PHILOSOPHY
          </h2>

          <p>
            We remove noise from fashion. Every cut, fabric, and silhouette is
            intentional. The goal is timeless wearability, not trends.
          </p>
        </div>

        <img
          src="/abt2.jpg"
          className="w-full h-[500px] object-cover order-1 md:order-2"
        />
      </div>

      {/* CENTER TEXT */}
      <div className="px-10 py-24 text-center max-w-2xl mx-auto text-gray-600 leading-7">
        Fashion is not about attention — it is about presence.
        VELRA is built for people who value simplicity and confidence in everyday life.
      </div>

      {/* IMAGE ROW */}
      <div className="px-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center mb-32">

        <img
          src="/abt3.jpg"
          className="w-full h-[450px] object-cover"
        />

        <img
          src="/abt4.jpg"
          className="w-full h-[450px] object-cover"
        />

      </div>

      {/* FINAL SECTION */}
      <div className="px-10 max-w-4xl mx-auto text-center py-28">

        <img
          src="/abt5.jpg"
          className="w-full h-[500px] object-cover mb-10"
        />

        <h2 className="text-xl tracking-[0.4em] font-[var(--font-playfair)]">
          VELRA — BUILT FOR MODERN IDENTITY
        </h2>

      </div>

    </div>
  );
}

export default AboutPage;