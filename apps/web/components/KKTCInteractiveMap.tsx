"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Building2, Users, TrendingUp, ArrowRight } from "lucide-react";

interface CityData {
  name: string;
  position: { x: number; y: number };
  jobs: number;
  growth: number;
  companies: number;
  categories: string[];
  description: string;
}

const KKTC_CITIES: CityData[] = [
  {
    name: "Lefkoşa",
    position: { x: 45, y: 35 },
    jobs: 8420,
    growth: 12.5,
    companies: 156,
    categories: ["Bilişim Teknolojileri", "Profesyonel Hizmetler", "Eğitim"],
    description: "KKTC'nin başkenti ve önde gelen iş istihdam merkezi",
  },
  {
    name: "Girne",
    position: { x: 30, y: 25 },
    jobs: 3200,
    growth: 8.3,
    companies: 89,
    categories: ["Turizm", "Konaklama", "Yiyecek & İçecek"],
    description: "Turizm sektöründe stratejik konum",
  },
  {
    name: "Mağusa",
    position: { x: 70, y: 45 },
    jobs: 4500,
    growth: 15.2,
    companies: 124,
    categories: ["Sanayi", "Lojistik", "Ticaret"],
    description: "Hızla gelişen ticaret ve sanayi hub'ı",
  },
  {
    name: "Güzelyurt",
    position: { x: 25, y: 55 },
    jobs: 1800,
    growth: 6.7,
    companies: 52,
    categories: ["Tarım", "İnşaat", "Üretim"],
    description: "Tarım ve tarım işleme sektörü odaklı",
  },
  {
    name: "İskele",
    position: { x: 60, y: 20 },
    jobs: 1200,
    growth: 4.2,
    companies: 38,
    categories: ["Turizm", "Marina", "Denizcilik"],
    description: "Akdeniz turizmi ve denizcilik faaliyetleri",
  },
  {
    name: "Lefke",
    position: { x: 35, y: 45 },
    jobs: 950,
    growth: 3.8,
    companies: 28,
    categories: ["Tarım", "KOBİ"],
    description: "Tarım bölgesi ve küçük ölçekli işletmeler",
  },
];

export default function KKTCInteractiveMap() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);

  return (
    <section className="relative w-full py-20 bg-gradient-to-br from-surface-light via-surface-cream to-secondary/5 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-10 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-heading font-display font-bold text-text-primary mb-4">
            KKTC Bölgesel İstihdam Analizi
          </h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto">
            Bölgesel istihdam verilerini detaylı analiz edin ve coğrafi iş istihdam fırsatlarını keşfedin
          </p>
        </motion.div>

        {/* 3D Map Container */}
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Cyprus Island Shape (CSS 3D) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full aspect-[3/2] bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              transform: "perspective(1000px) rotateX(5deg) rotateY(-5deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* 3D Surface Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/10 backdrop-blur-sm" />

            {/* Cyprus Island Shape */}
            <div className="absolute inset-8 border-4 border-primary-500/30 rounded-3xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 backdrop-blur-md">
              {/* Mountain/Terrain Effect */}
              <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />
                <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-secondary-500/20 rounded-full blur-2xl" />
                <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-accent-500/15 rounded-full blur-2xl" />
              </div>

              {/* Cities */}
              {KKTC_CITIES.map((city, index) => (
                <motion.div
                  key={city.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${city.position.x}%`,
                    top: `${city.position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  onClick={() => setSelectedCity(city)}
                >
                  {/* City Marker */}
                  <motion.div
                    animate={{
                      scale: hoveredCity?.name === city.name ? 1.3 : 1,
                      boxShadow: hoveredCity?.name === city.name
                        ? "0 0 30px rgba(232, 152, 62, 0.6)"
                        : "0 0 15px rgba(232, 152, 62, 0.3)",
                    }}
                    className="relative"
                  >
                    {/* Pulse Effect */}
                    <motion.div
                      className="absolute inset-0 bg-primary-500 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Main Marker */}
                    <div className="relative w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>

                    {/* Job Count Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: hoveredCity?.name === city.name ? 1 : 0,
                        y: hoveredCity?.name === city.name ? 0 : 10,
                      }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg text-xs font-bold text-text-primary whitespace-nowrap"
                    >
                      {city.jobs.toLocaleString()} istihdam
                    </motion.div>
                  </motion.div>

                  {/* City Name */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-10 left-1/2 -translate-x-1/2 text-center"
                  >
                    <span className="text-xs font-bold text-text-primary bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md">
                      {city.name}
                    </span>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Depth Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </motion.div>

          {/* City Detail Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: selectedCity ? 1 : 0,
              y: selectedCity ? 0 : 20,
            }}
            className="mt-8 bg-white rounded-2xl shadow-2xl p-6 border border-primary-500/20"
          >
            {selectedCity ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      {selectedCity.name}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {selectedCity.description}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>İlanları İncele</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-light rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-primary-500" />
                      <span className="text-2xl font-bold text-text-primary">
                        {selectedCity.jobs.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Aktif İstihdam</p>
                  </div>

                  <div className="bg-surface-light rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-semantic-success" />
                      <span className="text-2xl font-bold text-text-primary">
                        %{selectedCity.growth}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Büyüme Oranı</p>
                  </div>

                  <div className="bg-surface-light rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-secondary-500" />
                      <span className="text-2xl font-bold text-text-primary">
                        {selectedCity.companies}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">İşveren Kuruluş</p>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    Öne Çıkan Sektörler
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCity.categories.map((category, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-r from-secondary-500/10 to-secondary-500/20 text-secondary-700 px-3 py-1 rounded-full text-sm font-medium border border-secondary-500/30"
                      >
                        {category}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-text-secondary/30 mx-auto mb-4" />
                <p className="text-text-secondary">
                  Haritada detaylı analiz için bir şehir seçiniz
                </p>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                label: "İstihdam Merkezi",
                value: "6",
                icon: MapPin,
                color: "text-primary-500",
                bg: "bg-primary-500/10",
              },
              {
                label: "Toplam İstihdam",
                value: "20,070",
                icon: Building2,
                color: "text-secondary-500",
                bg: "bg-secondary-500/10",
              },
              {
                label: "Ortalama Büyüme",
                value: "%8.4",
                icon: TrendingUp,
                color: "text-semantic-success",
                bg: "bg-semantic-success/10",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-xl p-4 shadow-lg border border-primary-500/10"
              >
                <div className={`flex items-center gap-3 ${stat.bg} ${stat.color} p-3 rounded-xl mb-3`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary">{stat.value}</h3>
                <p className="text-text-secondary text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}