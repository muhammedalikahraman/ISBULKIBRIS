"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, Building2, Clock, ArrowRight, ChevronDown } from "lucide-react";

interface Job {
  id: string;
  title: string;
  organizationName: string;
  citySlug: string;
  slug: string;
  description?: string;
  publishedAt?: string | null;
  category?: string;
  verifiedOrganization?: boolean;
}

interface JobListPageProps {
  jobs: Job[];
  cities: { slug: string; name: string; region: string | null }[];
  categories: { slug: string; name: string }[];
  locale: string;
}

export default function JobListPage({ jobs, cities, categories, locale }: JobListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = !selectedCity || job.citySlug === selectedCity;
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesSearch && matchesCity && matchesCategory;
  });

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-surface-light via-surface-cream to-secondary/5">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-heading font-display font-bold text-text-primary mb-4">
            Profesyonel İş İlanları
          </h1>
          <p className="text-body text-text-secondary">
            {cities.length} şehir · {categories.length} kategori · {jobs.length} aktif pozisyon
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-primary-500/20">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pozisyon veya şirket ara..."
                  className="w-full pl-12 pr-4 py-3 bg-surface-light rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              {/* Filter Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  showFilters
                    ? "bg-primary-500 text-white shadow-primary-glow"
                    : "bg-surface-light text-text-primary hover:bg-primary-500/10"
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filtreler</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* City Filter */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">Şehir</label>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCity(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !selectedCity
                          ? "bg-primary-500 text-white"
                          : "bg-surface-light text-text-primary hover:bg-primary-500/10"
                      }`}
                    >
                      Tümü
                    </motion.button>
                    {cities.map((city) => (
                      <motion.button
                        key={city.slug}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCity(city.slug)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedCity === city.slug
                            ? "bg-primary-500 text-white"
                            : "bg-surface-light text-text-primary hover:bg-primary-500/10"
                        }`}
                      >
                        {city.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        !selectedCategory
                          ? "bg-secondary-500 text-white"
                          : "bg-surface-light text-text-primary hover:bg-secondary-500/10"
                      }`}
                    >
                      Tümü
                    </motion.button>
                    {categories.map((category) => (
                      <motion.button
                        key={category.slug}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedCategory === category.slug
                            ? "bg-secondary-500 text-white"
                            : "bg-surface-light text-text-primary hover:bg-secondary-500/10"
                        }`}
                      >
                        {category.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-text-secondary text-sm">
            {filteredJobs.length} pozisyon bulundu
          </p>
        </motion.div>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
            <p className="text-text-secondary text-lg">
              Aradığınız kriterlere uygun pozisyon bulunamadı
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white rounded-2xl shadow-lg border border-primary-500/10 hover:border-primary-500/30 hover:shadow-elevated transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {job.verifiedOrganization && (
                          <span className="bg-semantic-success/10 text-semantic-success px-2 py-0.5 rounded-full text-xs font-medium">
                            Doğrulanmış
                          </span>
                        )}
                        {job.category && (
                          <span className="bg-secondary-500/10 text-secondary-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {job.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 text-text-secondary text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.organizationName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.citySlug}</span>
                        </div>
                        {job.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(job.publishedAt as string).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-text-secondary text-sm line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="ml-4"
                    >
                      <a
                        href={`/${locale}/ilan/${job.slug}`}
                        className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-primary-glow hover:shadow-lg transition-all"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}