"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import { Autoplay, Pagination, Keyboard, EffectFade } from "swiper/modules";

export default function Landingpage() {
  return (
    <div className="h-screen w-full relative">

      <Swiper
        modules={[Autoplay, Pagination, Keyboard, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        keyboard={{ enabled: true }}
        loop={true}
        className="h-screen w-full relative z-0"
      >

        <SwiperSlide>
          <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/model1.jpg')" }} />
        </SwiperSlide>

        <SwiperSlide>
          <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/model2.jpg')" }} />
        </SwiperSlide>

        <SwiperSlide>
          <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/model3.jpg')" }} />
        </SwiperSlide>

        <SwiperSlide>
          <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/model4.jpg')" }} />
        </SwiperSlide>

        <SwiperSlide>
          <div className="h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('/model5.jpg')" }} />
        </SwiperSlide>

      </Swiper>
    </div>
  );
}