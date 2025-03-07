import React, { useState, useEffect } from 'react';
import { Tag, Info, Star, Github, Heart, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VersionInfoProps {
  darkMode?: boolean;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({ darkMode = false }) => {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string>('v1.1.0');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [versionDetails, setVersionDetails] = useState<string[]>([
    'رفع مشکل عملکرد "پوشه‌های مستثنی"',
    'اضافه شدن دکمه بارگذاری مجدد برای به‌روزرسانی با تنظیمات جدید',
    'بهبود پشتیبانی از حالت تاریک برای تمام المان‌های رابط کاربری',
    'رفع مشکل ارجاع آیکون‌ها و مسائل استایل',
    'بهبود مدیریت خطا برای دسترسی به پوشه‌ها'
  ]);

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'
          } transition-colors`}
          title="Version Information"
        >
          <Tag className="w-3 h-3" />
          <span>{version}</span>
        </button>
        
        {showDetails && (
          <div 
            className={`absolute left-0 bottom-full mb-2 w-72 p-4 rounded-lg shadow-lg z-10 ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-medium flex items-center gap-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Info className="w-4 h-4" />
                <span>FolderFusionX {version}</span>
              </h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className={`text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('buttons.close')}
              </button>
            </div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="mb-2">{t('version.releaseDate')}: ۳ آبان ۱۴۰۴</p>
              <p className="font-medium mt-3 mb-1">{t('version.whatsNew')}</p>
              <ul className="list-disc pl-4 space-y-1">
                {versionDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-2">
                <a 
                  href="https://github.com/LaneZero/FolderFusionX/releases" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}
                >
                  <Github className="w-3 h-3" />
                  <span>{t('version.viewChangelog')}</span>
                </a>
                <a 
                  href="https://github.com/LaneZero/FolderFusionX" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}
                >
                  <Star className="w-3 h-3" />
                  <span>{t('version.starOnGithub')}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Donate button */}
      <a
        href="https://www.coffeete.ir/AhmadR3zA"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
          darkMode 
            ? 'bg-pink-900/30 text-pink-400 hover:bg-pink-900/50' 
            : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
        }`}
        title={t('footer.donate')}
      >
        <Heart className="w-3 h-3" />
        <span>{t('footer.donate')}</span>
      </a>
      
      {/* More projects button */}
      <a
        href="https://github.com/LaneZero"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
          darkMode 
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={t('footer.moreProjects')}
      >
        <Code className="w-3 h-3" />
        <span>{t('footer.moreProjects')}</span>
      </a>
    </div>
  );
};