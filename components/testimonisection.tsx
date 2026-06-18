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
      name: 'Hendra Wijaya',
      role: 'Pendiri Yayasan Bina Karya',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      text: 'Layanan Dokasah luar biasa. Pengurusan izin yayasan kami dibantu dengan sangat cepat dan profesional. Sudah 2 kali kami menggunakan jasa Dokasah dan selalu puas dengan pelayanannya.'
    },
    {
      id: 2,
      name: 'Diana Lestari',
      role: 'CEO PT Lestari Group',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      text: 'Sangat merekomendasikan Dokasah untuk pendirian PT. Prosesnya sangat transparan, harga terjangkau, dan selesai tepat waktu tanpa kendala administratif.'
    },
    {
      id: 3,
      name: 'Rian Hidayat',
      role: 'Founder CV Tech Solution',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      text: 'Tim responsif dan komunikatif. Pertanyaan saya selalu dijawab dengan cepat. Dokumen NIB dan legalitas CV kami selesai hanya dalam hitungan hari.'
    },
    {
      id: 4,
      name: 'Siti Rahma',
      role: 'Pemilik PT Sentosa Abadi',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
      text: 'Proses pembuatan PT Perorangan sangat mudah lewat aplikasi Dokasah. Cukup isi form online, semua langsung diurus sampai selesai.'
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
        slidesPerView: 3,
      },
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-805 mb-4 animate-fade-in-up">
            Apa Kata Mereka?
          </h2>
          <p className="text-gray-650 max-w-2xl mx-auto">
            Lihat Testimoni transaksi berhasil & kepuasan pelanggan!
          </p>
        </div>

        <div className="relative group">
          <button 
            className="testimoni-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 -translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
            aria-label="Previous testimoni"
          >
            <svg className="w-6 h-6 text-gray-805" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <Swiper {...swiperParams} className="pt-8 pb-12">
            {testimoniData.map((testimoni) => (
              <SwiperSlide key={testimoni.id} className="!h-auto">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[280px] h-full hover:-translate-y-1.5 relative group">
                  {/* Quotes Icon Background */}
                  <span className="absolute right-6 top-6 text-slate-100 group-hover:text-blue-50/70 transition-colors duration-300 pointer-events-none">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
                    </svg>
                  </span>

                  <div className="space-y-4 z-10">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Feedback Text */}
                    <p className="text-gray-650 text-sm leading-relaxed line-clamp-4">
                      "{testimoni.text}"
                    </p>
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50 z-10">
                    <img
                      src={testimoni.image}
                      alt={testimoni.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-gray-805 text-sm leading-snug">
                        {testimoni.name}
                      </h4>
                      <p className="text-[11px] text-gray-450">
                        {testimoni.role}
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

        <div className="testimoni-pagination !relative flex justify-center space-x-2 !mt-10" />
      </div>
    </section>
  );
};

export default Testimonisection;