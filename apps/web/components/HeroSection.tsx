"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Mic, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const intentExamples = [
    "Kıbrıs'ta yazılım mühendisliği pozisyonu",
    "Lefkoşa'da profesyonel hizmet sektörü",
    "Yabancı dil gerektirmeyen kurumsal pozisyonlar",
    "Remote çalışma imkanı olan kurumsal iş ilanları",
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      const aiSuggestions = intentExamples.filter(
        (example) =>
          example.toLowerCase().includes(searchQuery.toLowerCase()) ||
          searchQuery.split(" ").some((word) =>
            example.toLowerCase().includes(word.toLowerCase())
          )
      );
      setSuggestions(aiSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

  const handleAISearch = () => {
    setAiProcessing(true);
    setTimeout(() => {
      setAiProcessing(false);
    }, 2000);
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-surface-light via-surface-cream to-secondary/10 overflow-hidden">
      {/* Professional Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Layer 1: Primary Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 2: Secondary Gradient Orbs */}
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full blur-3xl opacity-15"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -40, 0],
            y: [0, -40, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 3: Accent Gradient Orbs */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full blur-3xl opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 4: Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-primary-400 rounded-full opacity-30"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
          />
        ))}

        {/* Layer 5: Gradient Mesh Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary-500/5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* AI-Powered Search Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-accent-500/10 text-accent-500 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-accent-500/20 shadow-lg backdrop-blur-sm"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 20px rgba(124, 58, 237, 0.2)",
                "0 0 30px rgba(124, 58, 237, 0.4)",
                "0 0 20px rgba(124, 58, 237, 0.2)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span className="bg-gradient-to-r from-accent-500 to-accent-400 bg-clip-text text-transparent font-semibold">
              Yapay Zeka Destekli İş Eşleştirme
            </span>
          </motion.div>

          <h1 className="text-hero font-display font-bold text-text-primary mb-6 leading-tight">
            Kıbrıs'ta{" "}
            <span className="bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Hedeflenen Kariyer Fırsatını
            </span>{" "}
            Yakalayın
          </h1>

          <p className="text-body text-text-secondary max-w-2xl mx-auto mb-12">
            Yapay zeka destekli profesyonel iş eşleştirme platformu ile yüzlerce iş ilanı arasından
            size en uygun kariyer pozisyonlarını optimize edilmiş hızda keşfedin.
          </p>

          {/* Intent-Driven Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-elevated p-2 border-2 border-transparent hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Hangi kariyer pozisyonunu hedefliyorsunuz? (örn: 'Kıbrıs'ta yazılım mühendisliği')"
                    className="w-full pl-12 pr-4 py-4 text-body bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-text-secondary/50"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVoiceInput}
                  className={`p-4 rounded-xl transition-all ${
                    isListening
                      ? "bg-ai-processing text-white shadow-ai-glow"
                      : "bg-surface-light text-text-secondary hover:bg-accent-500/10"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAISearch}
                  disabled={aiProcessing}
                  className={`px-8 py-4 rounded-xl font-medium transition-all ${
                    aiProcessing
                      ? "bg-accent-500/50 text-white cursor-not-allowed"
                      : "bg-primary-gradient text-white shadow-primary-glow hover:shadow-lg"
                  }`}
                >
                  {aiProcessing ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>AI Analiz Ediyor...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Pozisyon Bul</span>
                    </span>
                  )}
                </motion.button>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 border-t border-border/50"
                >
                  <p className="text-sm text-text-secondary mb-2 text-left">
                    Yapay Zeka Önerileri:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSearchQuery(suggestion)}
                        className="px-3 py-1.5 bg-accent-500/10 text-accent-500 rounded-lg text-sm hover:bg-accent-500/20 transition-colors"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* KKTC 2025-2026 Real Data Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {[
            {
              icon: TrendingUp,
              label: "İstihdam (2025 Q3)",
              value: "189,791",
              color: "text-semantic-success",
              bg: "bg-semantic-success/10",
              subtitle: "İstihdam Oranı: %50.3",
            },
            {
              icon: Users,
              label: "İşsizlik Oranı",
              value: "%4.7",
              color: "text-secondary",
              bg: "bg-secondary/10",
              subtitle: "Genç İşsizlik: %12.4",
            },
            {
              icon: Zap,
              label: "Hizmetler Sektörü",
              value: "%75.4",
              color: "text-primary",
              bg: "bg-primary/10",
              subtitle: "Ana istihdam alanı",
            },
            {
              icon: Sparkles,
              label: "İşgücü Katılımı",
              value: "%52.8",
              color: "text-accent",
              bg: "bg-accent/10",
              subtitle: "Erkek: %64.6, Kadın: %39.4",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-surface-elevated rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-elevated transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bg} ${stat.color} mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-text-primary mb-1">{stat.value}</h3>
              <p className="text-text-secondary text-sm font-medium mb-2">{stat.label}</p>
              <p className="text-text-secondary/70 text-xs">{stat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">
            Öne Çıkan Profesyonel Sektörler
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Bilişim Teknolojileri",
              "Turizm & Konaklama",
              "Muhasebe & Finans",
              "Pazarlama & İletişim",
              "Eğitim",
              "Sağlık Hizmetleri",
              "İnşaat & Altyapı",
              "Lojistik & Taşımacılık",
            ].map((category, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(124, 58, 237, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-surface-elevated rounded-xl p-4 text-center border border-border/50 hover:border-accent-500/50 transition-all duration-300"
              >
                <span className="text-text-primary font-medium">{category}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}