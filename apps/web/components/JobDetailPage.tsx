"use client";

import { motion } from "framer-motion";
import { MapPin, Building2, Clock, Calendar, Share2, Bookmark, CheckCircle, ExternalLink } from "lucide-react";

interface JobDetailPageProps {
  job: {
    title: string;
    organizationName: string;
    citySlug: string;
    description: string;
    publishedAt: string | null;
    verifiedOrganization: boolean;
    salary?: string;
    employmentType?: string;
    experienceLevel?: string;
    remote?: boolean;
  };
  locale: string;
  url: string;
}

export default function JobDetailPage({ job, locale, url }: JobDetailPageProps) {
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

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <a
            href={`/${locale}/ilanlar`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4 rotate-180" />
            <span>İlanlara Dön</span>
          </a>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-primary-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-border/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {job.verifiedOrganization && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 bg-semantic-success/10 text-semantic-success px-3 py-1 rounded-full text-sm font-medium mb-3"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Doğrulanmış İşveren</span>
                  </motion.div>
                )}
                <h1 className="text-3xl font-bold text-text-primary mb-4">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">{job.organizationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary-500" />
                    <span>{job.citySlug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent-500" />
                    <span>{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-surface-light rounded-xl hover:bg-primary-500/10 transition-colors"
                  title="Kaydet"
                >
                  <Bookmark className="w-5 h-5 text-text-secondary" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-surface-light rounded-xl hover:bg-primary-500/10 transition-colors"
                  title="Paylaş"
                >
                  <Share2 className="w-5 h-5 text-text-secondary" />
                </motion.button>
              </div>
            </div>

            {/* Job Meta */}
            <div className="flex flex-wrap gap-3">
              {job.employmentType && (
                <span className="bg-primary-500/10 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium">
                  {job.employmentType}
                </span>
              )}
              {job.experienceLevel && (
                <span className="bg-secondary-500/10 text-secondary-700 px-3 py-1 rounded-lg text-sm font-medium">
                  {job.experienceLevel}
                </span>
              )}
              {job.remote && (
                <span className="bg-accent-500/10 text-accent-700 px-3 py-1 rounded-lg text-sm font-medium">
                  Remote
                </span>
              )}
              {job.salary && (
                <span className="bg-semantic-success/10 text-semantic-success px-3 py-1 rounded-lg text-sm font-medium">
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">İş Tanımı</h2>
            <div className="prose prose-lg max-w-none text-text-secondary whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Apply Button */}
          <div className="p-8 border-t border-border/50 bg-surface-light/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-bold text-lg shadow-primary-glow hover:shadow-lg transition-all"
            >
              Başvuru Yap
            </motion.button>
          </div>
        </motion.div>

        {/* Similar Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h3 className="text-xl font-bold text-text-primary mb-4">Benzer Pozisyonlar</h3>
          <div className="bg-white rounded-2xl shadow-lg border border-primary-500/20 p-6">
            <p className="text-text-secondary text-center py-8">
              Benzer pozisyonlar yükleniyor...
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}