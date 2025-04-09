import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Testimonisection = () => {
  const testimoniData = [
    {
      id: 1,
      image: 'https://file.ccgnimex.my.id/file/ccgnimex/dokasah/berkas/Branding%20Dokasah/testimoni1.jpeg',
      text: 'Pelanggan yang order yayasan lebih dari 2x'
    },
    {
      id: 2,
      image: 'https://file.ccgnimex.my.id/file/ccgnimex/dokasah/berkas/Branding%20Dokasah/testimoni2.jpeg',
      text: 'Testimoni order PT yang sangat memuaskan'
    },
    {
      id: 3,
      image: 'https://file.ccgnimex.my.id/file/ccgnimex/dokasah/berkas/Branding%20Dokasah/testimoni3.jpeg',
      text: 'Proses pengurusan dokumen cepat & respon tim sangat baik'
    },
    {
      id: 4,
      image: 'https://file.ccgnimex.my.id/file/ccgnimex/dokasah/berkas/Branding%20Dokasah/testimoni4.jpeg',
      text: 'Layanan profesional untuk berbagai jenis badan usaha'
    }
  ];

  const swiperParams = {
    modules: [Navigation, Pagination, Autoplay],
    spaceBetween: 30,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: { 
      clickable: true,
      el: '.testimoni-pagination',
      type: 'bullets',
    },
    navigation: {
      nextEl: '.testimoni-next',
      prevEl: '.testimoni-prev',
    },
    breakpoints: {
      640: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 4,
      },
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 animate-fade-in-up">
            Apa Kata Mereka?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lihat Testimoni transaksi berhasil & kepuasan pelanggan!
          </p>
        </div>

        <div className="relative group">
          <button 
            className="testimoni-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 -translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
            aria-label="Previous testimoni"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <Swiper {...swiperParams} className="py-8">
            {testimoniData.map((testimoni) => (
              <SwiperSlide key={testimoni.id}>
                <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                  <div className="aspect-square relative">
                    <Image
                      src={testimoni.image}
                      alt={`Testimoni pengguna Dokasah ${testimoni.id}`}
                      width={600}
                      height={600}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      loading={testimoni.id > 2 ? 'lazy' : 'eager'}
                      quality={85}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div className="text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <svg className="w-8 h-8 mb-2 opacity-75" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                      </svg>
                      <p className="font-medium line-clamp-3 text-sm md:text-base">
                        {testimoni.text}
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button 
            className="testimoni-next absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
            aria-label="Next testimoni"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="testimoni-pagination flex justify-center space-x-2 mt-8" />
      </div>
    </section>
  );
};

export default Testimonisection;